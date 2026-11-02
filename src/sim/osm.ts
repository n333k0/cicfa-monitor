// REAL open-source intelligence for a selected institution, pulled live from
// OpenStreetMap via the public Nominatim API (CORS-enabled, no key). Everything
// here is REAL public data and must stay strictly separate from the simulated
// attack layer. Cached in memory + localStorage (7 days) so clicking an
// institution twice doesn't re-hit the API (also respects Nominatim's usage
// policy: identified by the browser Referer, cached, at most one lookup/click).
import type { Institution } from './types';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const TTL = 7 * 24 * 3600 * 1000;
const PREFIX = 'cicfa.osm.';

export interface OsmData {
  name?: string;
  address?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  openNow?: 'OPEN' | 'CLOSED' | null;
  wheelchair?: string;
  operator?: string;
  startDate?: string;
  heritage?: boolean;
  fee?: string;
  wikidata?: string;
  wikipedia?: string;
  osmType?: string;
  osmId?: number;
}
export type OsmState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: OsmData };

type Extra = Record<string, string>;
type Place = {
  lat: string; lon: string; name?: string; display_name?: string;
  category?: string; class?: string; type?: string; osm_type?: string; osm_id?: number;
  address?: Record<string, string>; extratags?: Extra;
};

const R = Math.PI / 180;
function distM(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dLat = (bLat - aLat) * R, dLon = (bLon - aLon) * R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * R) * Math.cos(bLat * R) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const OSM_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']; // OSM order, index 0..6
/** best-effort "open now" for common opening_hours forms; null when unsure */
export function openNow(oh: string, now = new Date()): 'OPEN' | 'CLOSED' | null {
  const s = oh.trim();
  if (/24\s*\/\s*7/.test(s)) return 'OPEN';
  if (/ph|easter|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week|sunset|sunrise|\bopen\b|\bclosed\b/i.test(s)) return null;
  const today = (now.getDay() + 6) % 7;      // JS Su=0 → OSM Mo=0
  const mins = now.getHours() * 60 + now.getMinutes();
  let sawTimesToday = false;
  for (const raw of s.split(';')) {
    const rule = raw.trim();
    if (!rule || /off/i.test(rule)) continue;
    const times = [...rule.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
    if (!times.length) return null;          // a rule we can't read → bail
    const dayPart = rule.slice(0, rule.search(/\d{1,2}:/)).trim();
    const days = new Set<number>();
    if (!dayPart) { for (let i = 0; i < 7; i++) days.add(i); }
    else {
      for (const tok of dayPart.split(',')) {
        const m = tok.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?$/);
        if (!m) return null;
        const a = OSM_DAYS.indexOf(m[1]);
        const b = m[2] ? OSM_DAYS.indexOf(m[2]) : a;
        for (let i = a; ; i = (i + 1) % 7) { days.add(i); if (i === b) break; }
      }
    }
    if (!days.has(today)) continue;
    sawTimesToday = true;
    for (const t of times) {
      const start = +t[1] * 60 + +t[2];
      let end = +t[3] * 60 + +t[4];
      if (end === 0) end = 24 * 60;
      if (mins >= start && mins < end) return 'OPEN';
    }
  }
  return sawTimesToday ? 'CLOSED' : 'CLOSED';
}

const ARTS_TYPE = /museum|gallery|arts_centre|artwork|attraction|exhibition/;
/** choose the real POI for an institution: prefer a cultural venue, nearest first;
 *  fall back to the nearest named place. Reject anything too far (coords may be approximate). */
function pick(places: Place[], inst: Institution): Place | null {
  const cand = places.map((pl) => {
    const cat = pl.category ?? pl.class ?? '';
    const type = pl.type ?? '';
    const arts = cat === 'tourism' || (cat === 'amenity' && /arts_centre|theatre|community_centre|exhibition_centre/.test(type)) || ARTS_TYPE.test(type);
    const nm = pl.name ?? pl.display_name?.split(',')[0] ?? '';
    const a = norm(inst.name), b = norm(nm);
    const named = b.length > 2 && (a.includes(b) || b.includes(a));
    return { pl, d: distM(inst.lat, inst.lon, +pl.lat, +pl.lon), arts, named };
  });
  const arts = cand.filter((c) => c.arts);
  const pool = arts.length ? arts : cand;
  // nearest in the chosen pool, but let a clear name match jump ahead of a marginally closer one
  pool.sort((a, b) => (a.named === b.named ? a.d - b.d : a.named ? -1 : 1));
  const best = pool[0];
  return best && best.d < 600 ? best.pl : null;
}

function toData(pl: Place): OsmData {
  const t = pl.extratags ?? {};
  const a = pl.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const area = a.neighbourhood ?? a.suburb ?? a.city_district ?? a.city;
  const oh = t.opening_hours;
  return {
    name: pl.name ?? pl.display_name?.split(',')[0],
    address: [street, area].filter(Boolean).join(', ') || undefined,
    description: t.description,
    website: t.website ?? t['contact:website'] ?? t.url,
    phone: t.phone ?? t['contact:phone'],
    email: t.email ?? t['contact:email'],
    openingHours: oh,
    openNow: oh ? openNow(oh) : undefined,
    wheelchair: t.wheelchair,
    operator: t.operator ?? (t['operator:type'] ? `${t['operator:type']} operator` : undefined),
    startDate: t.start_date ?? t.year_of_construction,
    heritage: t.heritage != null || t['heritage:operator'] != null,
    fee: t.fee,
    wikidata: t.wikidata,
    wikipedia: t.wikipedia,
    osmType: pl.osm_type,
    osmId: pl.osm_id,
  };
}

function readCache(id: string): OsmState | null {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const { t, s } = JSON.parse(raw);
    if (Date.now() - t > TTL) return null;
    if (s.status === 'ok' && s.data.openingHours) s.data.openNow = openNow(s.data.openingHours); // refresh volatile flag
    return s;
  } catch { return null; }
}
function writeCache(id: string, s: OsmState) {
  try { localStorage.setItem(PREFIX + id, JSON.stringify({ t: Date.now(), s })); } catch { /* quota */ }
}

const mem = new Map<string, Promise<OsmState>>();

async function fetchNom(url: string): Promise<Place[]> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 16000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(to); }
}

async function query(inst: Institution): Promise<OsmState> {
  const d = 0.018; // ~2km viewbox around the institution
  const box = `${inst.lon - d},${inst.lat + d},${inst.lon + d},${inst.lat - d}`;
  const common = 'format=jsonv2&extratags=1&addressdetails=1&accept-language=es&limit=8';
  // dedupe can leave names like "MALBA — Museo de Arte…"; search the common short name
  // (first segment before a dash/colon/paren), and only add the city if not already in it
  const short = (inst.name.split(/\s[—–-]\s|[:(]/)[0].trim() || inst.name);
  const term = new RegExp(inst.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(short) ? short : `${short} ${inst.city}`;
  const q = encodeURIComponent(term);
  try {
    let places = await fetchNom(`${ENDPOINT}?q=${q}&viewbox=${box}&bounded=1&${common}`);
    if (!places.length) places = await fetchNom(`${ENDPOINT}?q=${q}&${common}`); // widen if the box was empty
    const pl = pick(places, inst);
    const s: OsmState = pl ? { status: 'ok', data: toData(pl) } : { status: 'none' };
    writeCache(inst.id, s);
    return s;
  } catch (e) {
    return { status: 'error', message: e instanceof Error && e.name === 'AbortError' ? 'timeout' : (e as Error).message || 'network' };
  }
}

/** Load real OSM intelligence for an institution (cached in memory + localStorage). */
export function loadOsm(inst: Institution): Promise<OsmState> {
  const cached = readCache(inst.id);
  if (cached) return Promise.resolve(cached);
  let p = mem.get(inst.id);
  if (!p) { p = query(inst); mem.set(inst.id, p); p.finally(() => setTimeout(() => mem.delete(inst.id), 2000)); }
  return p;
}

export function osmLink(i: Institution) { return `https://www.openstreetmap.org/?mlat=${i.lat}&mlon=${i.lon}#map=18/${i.lat}/${i.lon}`; }
