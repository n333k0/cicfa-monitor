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
export interface Cam { id: string; name: string; lat: number; lon: number; url: string; source: string }

const R = Math.PI / 180;
function distKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dLat = (bLat - aLat) * R, dLon = (bLon - aLon) * R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * R) * Math.cos(bLat * R) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// A camera network = a bounding box (so we only fetch its catalog when the target
// is inside it) + a loader. Extensible: add more official catalogs here later.
interface Network { id: string; bbox: [number, number, number, number]; load: () => Promise<Cam[]> } // bbox [minLat,minLon,maxLat,maxLon]

const LS_PREFIX = 'cicfa.cams.';
const LIST_TTL = 24 * 3600 * 1000;
async function cachedList(id: string, loader: () => Promise<Cam[]>): Promise<Cam[]> {
  try {
    const raw = localStorage.getItem(LS_PREFIX + id);
    if (raw) { const { t, c } = JSON.parse(raw); if (Date.now() - t < LIST_TTL) return c; }
  } catch { /* ignore */ }
  const c = await loader();
  try { localStorage.setItem(LS_PREFIX + id, JSON.stringify({ t: Date.now(), c })); } catch { /* quota */ }
  return c;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TflPlace = { id: string; commonName?: string; lat?: number; lon?: number; additionalProperties?: { key: string; value: string }[] };
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
];

const memNet = new Map<string, Promise<Cam[]>>();
function loadNetwork(n: Network) {
  let p = memNet.get(n.id);
  if (!p) { p = cachedList(n.id, n.load).catch(() => [] as Cam[]); memNet.set(n.id, p); }
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

/** Cache-busting token so a camera still refreshes every `everyMs` (not every render). */
export function camStamp(everyMs = 6000) { return Math.floor(Date.now() / everyMs); }
