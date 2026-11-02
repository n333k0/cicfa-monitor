// REAL reconnaissance imagery for a selected institution — overhead satellite
// (Esri World Imagery, keyless) + the nearest PUBLIC traffic camera (official
// government feeds only, e.g. Transport for London JamCams). Everything here is
// real public data, kept separate from the simulated attack layer. In the
// spirit of bilawalsidhu/gods-eye-view (MIT): same public sources, our own
// deck.gl/React + terminal rendering. No private or password-less cameras.

// ── Overhead satellite patch (Esri World Imagery, no key, CORS ok) ──────────
/** Centred satellite export image URL for a point. imageSR=4326 → square box maps
 *  to square pixels with no mercator stretch. latSpan ~0.0038° ≈ 420m across. */
export function esriPatch(lat: number, lon: number, latSpan = 0.0038, px = 360) {
  const lonSpan = latSpan / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const bbox = `${lon - lonSpan},${lat - latSpan},${lon + lonSpan},${lat + latSpan}`;
  return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${px},${px}&format=jpg&f=image`;
}

// ── Public traffic cameras (official catalogs only) ─────────────────────────
export interface Cam { id: string; name: string; lat: number; lon: number; url: string; source: string; noBust?: boolean }

const R = Math.PI / 180;
function distKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dLat = (bLat - aLat) * R, dLon = (bLon - aLon) * R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * R) * Math.cos(bLat * R) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// A camera network = a bounding box (so we only fetch its catalog when the target
// is inside it) + a loader. Ships: TfL London, Caltrans (LA / SF / San Diego), City of
// Austin, Singapore LTA — all official, keyless, CORS-open. (NYC DOT was unreachable.)
interface Network { id: string; bbox: [number, number, number, number]; ttl?: number; load: () => Promise<Cam[]> } // bbox [minLat,minLon,maxLat,maxLon]

const LS_PREFIX = 'cicfa.cams.';
const LIST_TTL = 24 * 3600 * 1000;
async function cachedList(id: string, loader: () => Promise<Cam[]>, ttl = LIST_TTL): Promise<Cam[]> {
  try {
    const raw = localStorage.getItem(LS_PREFIX + id);
    if (raw) { const { t, c } = JSON.parse(raw); if (Date.now() - t < ttl) return c; }
  } catch { /* ignore */ }
  const c = await loader();
  try { localStorage.setItem(LS_PREFIX + id, JSON.stringify({ t: Date.now(), c })); } catch { /* quota */ }
  return c;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TflPlace = { id: string; commonName?: string; lat?: number; lon?: number; additionalProperties?: { key: string; value: string }[] };
// Caltrans district CCTV catalogs (keyless, CORS *): LA, SF Bay Area, San Diego
type CaltransRow = { cctv: { index: string; inService: string; location: { locationName: string; nearbyPlace?: string; latitude: string; longitude: string }; imageData: { static: { currentImageURL: string } } } };
const caltrans = (d: number, bbox: [number, number, number, number], label: string): Network => ({
  id: `caltrans-d${d}`, bbox,
  load: async () => {
    const res = await fetch(`https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${String(d).padStart(2, '0')}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows: CaltransRow[] = (await res.json()).data;
    return rows.filter((r) => r.cctv.inService !== 'false' && r.cctv.imageData?.static?.currentImageURL).map((r) => ({
      id: `ct${d}-${r.cctv.index}`, name: r.cctv.location.locationName.replace(/\s+/g, ' ').trim(),
      lat: +r.cctv.location.latitude, lon: +r.cctv.location.longitude,
      url: r.cctv.imageData.static.currentImageURL, source: `Caltrans · ${label}`,
    })).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));
  },
});

const NETWORKS: Network[] = [
  {
    id: 'tfl', bbox: [51.25, -0.55, 51.72, 0.33], // Greater London
    load: async () => {
      const res = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam/', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: TflPlace[] = await res.json();
      return d.map((c) => {
        const p = Object.fromEntries((c.additionalProperties ?? []).map((x) => [x.key, x.value]));
        return { id: c.id, name: (c.commonName ?? '').replace(/\s+/g, ' ').trim(), lat: c.lat!, lon: c.lon!, url: p.imageUrl, source: 'TfL · London' } as Cam;
      }).filter((c) => c.url && Number.isFinite(c.lat) && Number.isFinite(c.lon));
    },
  },
  caltrans(7, [33.6, -119.0, 34.9, -117.6], 'Los Angeles'),
  caltrans(4, [36.9, -123.1, 38.9, -121.2], 'SF Bay Area'),
  caltrans(11, [32.5, -117.7, 33.5, -116.0], 'San Diego'),
  {
    id: 'austin', bbox: [30.0, -98.1, 30.6, -97.5], // City of Austin traffic cameras (Socrata open data)
    load: async () => {
      const res = await fetch('https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=2000&camera_status=TURNED_ON');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows: { camera_id: string; location_name?: string; screenshot_address?: string; location?: { coordinates: [number, number] } }[] = await res.json();
      return rows.filter((r) => r.screenshot_address && r.location).map((r) => ({
        id: `atx-${r.camera_id}`, name: (r.location_name ?? '').replace(/\s+/g, ' ').trim(),
        lat: r.location!.coordinates[1], lon: r.location!.coordinates[0], url: r.screenshot_address!, source: 'City of Austin',
      }));
    },
  },
  {
    id: 'sg', bbox: [1.15, 103.6, 1.48, 104.1], ttl: 3 * 60 * 1000, // Singapore LTA (image URLs rotate every minute)
    load: async () => {
      const res = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: { items: { cameras: { camera_id: string; image: string; location: { latitude: number; longitude: number } }[] }[] } = await res.json();
      return (d.items[0]?.cameras ?? []).map((c) => ({
        id: `sg-${c.camera_id}`, name: `LTA CAMERA ${c.camera_id}`, lat: c.location.latitude, lon: c.location.longitude,
        url: c.image, source: 'LTA · Singapore', noBust: true,
      }));
    },
  },
];

const memNet = new Map<string, Promise<Cam[]>>();
function loadNetwork(n: Network) {
  let p = memNet.get(n.id);
  if (!p) { p = cachedList(n.id, n.load, n.ttl).catch(() => [] as Cam[]); memNet.set(n.id, p); }
  return p;
}

/** Nearest PUBLIC camera to a point, or null. Only fetches a catalog when the
 *  target falls inside that network's bbox (so most targets cost no request). */
export async function nearestCam(lat: number, lon: number, maxKm = 0.7): Promise<{ cam: Cam; km: number } | null> {
  const nets = NETWORKS.filter((n) => lat >= n.bbox[0] && lat <= n.bbox[2] && lon >= n.bbox[1] && lon <= n.bbox[3]);
  if (!nets.length) return null;
  let best: { cam: Cam; km: number } | null = null;
  for (const n of nets) {
    for (const cam of await loadNetwork(n)) {
      const km = distKm(lat, lon, cam.lat, cam.lon);
      if (km <= maxKm && (!best || km < best.km)) best = { cam, km };
    }
  }
  return best;
}

/** All PUBLIC cameras inside a lon/lat box (for map markers). Only loads a catalog
 *  when its bbox intersects the view, and caps the count. */
export async function camsInView(minLat: number, minLon: number, maxLat: number, maxLon: number, cap = 160): Promise<Cam[]> {
  const nets = NETWORKS.filter((n) => !(n.bbox[2] < minLat || n.bbox[0] > maxLat || n.bbox[3] < minLon || n.bbox[1] > maxLon));
  if (!nets.length) return [];
  const out: Cam[] = [];
  for (const n of nets) {
    for (const c of await loadNetwork(n)) {
      if (c.lat >= minLat && c.lat <= maxLat && c.lon >= minLon && c.lon <= maxLon) out.push(c);
      if (out.length >= cap) break;
    }
  }
  return out;
}

/** All PUBLIC cameras within `maxKm` of a point, nearest first (the "zone" of a target). */
export async function camsNear(lat: number, lon: number, maxKm = 2, n = 6): Promise<{ cam: Cam; km: number }[]> {
  const nets = NETWORKS.filter((x) => lat >= x.bbox[0] && lat <= x.bbox[2] && lon >= x.bbox[1] && lon <= x.bbox[3]);
  const out: { cam: Cam; km: number }[] = [];
  for (const x of nets) for (const cam of await loadNetwork(x)) {
    const km = distKm(lat, lon, cam.lat, cam.lon);
    if (km <= maxKm) out.push({ cam, km });
  }
  return out.sort((a, b) => a.km - b.km).slice(0, n);
}

/** Cache-busting token so a camera still refreshes every `everyMs` (not every render). */
export function camStamp(everyMs = 6000) { return Math.floor(Date.now() / everyMs); }
/** Live image URL for a camera (cache-busted unless the source rotates its own URLs). */
export function camSrc(c: Cam) { return c.noBust ? c.url : `${c.url}${c.url.includes('?') ? '&' : '?'}t=${camStamp()}`; }
