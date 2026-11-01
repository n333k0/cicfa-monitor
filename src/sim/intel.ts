// Target-profile intelligence: everything here is derived from the simulation + public
// institution data. Assets, leaks and deadlines are fiction (symbolic, never real records).
import { INSTITUTIONS } from '../data/institutions';
import type { AttackEvent, Institution, VectorId } from './types';

export function haversineKm(aLon: number, aLat: number, bLon: number, bLat: number) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
/** same place listed twice (curated + Wikidata): close together and one name contains the other */
export function isDuplicate(a: Institution, b: Institution, km: number) {
  if (km > 1.5) return false;
  const x = norm(a.name), y = norm(b.name);
  return x.length > 2 && y.length > 2 && (x.includes(y) || y.includes(x));
}
/** nearest institutions to `inst` (link analysis: physical adjacency) */
export function nearest(inst: Institution, n = 6): { inst: Institution; km: number }[] {
  const out: { inst: Institution; km: number }[] = [];
  for (const d of INSTITUTIONS) {
    if (d.id === inst.id) continue;
    if (Math.abs(d.lat - inst.lat) > 8) continue;           // cheap prefilter
    const km = haversineKm(inst.lon, inst.lat, d.lon, d.lat);
    if (isDuplicate(inst, d, km)) continue;
    out.push({ inst: d, km });
  }
  return out.sort((a, b) => a.km - b.km).slice(0, n);
}

export const LEVELS = ['LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'CRITICAL'] as const;
export function threat(strikes: number, breaches: number) {
  const score = strikes + breaches * 2;
  const lvl = score < 2 ? 0 : score < 5 ? 1 : score < 9 ? 2 : score < 15 ? 3 : 4;
  const cells = Math.max(1, Math.min(20, Math.round(score)));
  return { level: LEVELS[lvl], lvl, bar: '█'.repeat(cells) + '░'.repeat(20 - cells) };
}

// each vector "touches" one symbolic asset of the institution
export const ASSETS: { vector: VectorId; asset: string; hit: string }[] = [
  { vector: 'defacement', asset: 'CURATORIAL_TEXT', hit: 'OVERWRITTEN' },
  { vector: 'exfiltration', asset: 'DONOR_REGISTRY', hit: 'EXFILTRATED' },
  { vector: 'ransomware', asset: 'WALL_TEXT', hit: 'LOCKED' },
  { vector: 'intrusion', asset: 'BOARD_MINUTES', hit: 'BREACHED' },
  { vector: 'implant', asset: 'ARCHIVE_VAULT', hit: 'IMPLANTED' },
  { vector: 'phishing', asset: 'PRESS_KIT', hit: 'SPOOFED' },
  { vector: 'ddos', asset: 'TICKETING_NODE', hit: 'SATURATED' },
  { vector: 'spam', asset: 'SOCIAL_FEED', hit: 'FLOODED' },
  { vector: 'beacon', asset: 'PROVENANCE_DB', hit: 'BEACONING' },
  { vector: 'recon', asset: 'POWER_MAP', hit: 'MAPPED' },
];
export function assetStates(hist: AttackEvent[]) {
  return ASSETS.map((a) => {
    const ev = hist.filter((e) => e.vector === a.vector);
    const won = ev.some((e) => e.outcome === 'breach' || e.outcome === 'exposed');
    return { ...a, n: ev.length, state: won ? a.hit : ev.length ? 'PROBED' : 'INTACT', won };
  });
}

// deterministic per-institution randomness (stable leak samples / deadlines)
export function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
const HEX = '0123456789ABCDEF';
export function leakSample(id: string, assets: string[], n = 6) {
  const r = seeded(id + ':leak');
  const hex = (k: number) => Array.from({ length: k }, () => HEX[(r() * 16) | 0]).join('');
  const pool = assets.length ? assets : ['POWER_MAP'];
  return Array.from({ length: n }, (_, i) => ({
    off: '0x' + (i * 0x40 + ((r() * 0x30) | 0)).toString(16).toUpperCase().padStart(4, '0'),
    asset: `${pool[i % pool.length]}[${String((r() * 99) | 0).padStart(2, '0')}]`,
    hash: `${hex(8)}…${hex(4)}`,
    tag: ['REDACTED', 'SYMBOLIC', 'UNVERIFIED', 'MIRRORED', 'NULL'][(r() * 5) | 0],
  }));
}
/** countdown-to-nothing: a deadline that always resolves to nothing, then restarts */
export function deadline(id: string, nowMs: number) {
  const period = 45 + Math.floor(seeded(id + ':t')() * 240);   // seconds
  const left = period - Math.floor(nowMs / 1000) % period;
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return { text: `00:${mm}:${ss}`, done: left <= 2 };
}
const GLYPH = '█▓▒░#%&@$/\\';
/** progressively scramble institutional language as breaches accumulate */
export function scramble(text: string, ratio: number, salt: number) {
  if (ratio <= 0) return text;
  let h = salt * 9301 + 49297;
  return text.split('').map((c) => {
    h = (h * 9301 + 49297) % 233280;
    return c !== ' ' && h / 233280 < ratio ? GLYPH[h % GLYPH.length] : c;
  }).join('');
}
export function osmLink(i: Institution) { return `https://www.openstreetmap.org/?mlat=${i.lat}&mlon=${i.lon}#map=17/${i.lat}/${i.lon}`; }
export function wikiLink(i: Institution) { return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(i.name + ' ' + i.city)}`; }
