// REAL "zone" intelligence for a selected institution — two keyless, CORS-open
// public sources, kept strictly separate from the simulated attack layer:
//  · Wikidata  — institutional record (founded, visitors/yr, collection size,
//                architect, director, owner, style, socials)
//  · Wikimedia Commons — street-level photographs geotagged around the site
//                (works everywhere, incl. Buenos Aires, where no public CCTV exists)
// Cached in memory + localStorage (7 days).
import type { Institution } from './types';

const TTL = 7 * 24 * 3600 * 1000;
const mem = new Map<string, Promise<unknown>>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const k = 'cicfa.zone.' + key;
  let p = mem.get(k) as Promise<T> | undefined;
  if (p) return p;
  p = (async () => {
    try { const raw = localStorage.getItem(k); if (raw) { const { t, v } = JSON.parse(raw); if (Date.now() - t < TTL) return v as T; } } catch { /* ignore */ }
    const v = await load();
    // empty / null answers are often transient (rate limits, partial continuations): retry next time
    if (v == null || (Array.isArray(v) && !v.length)) { mem.delete(k); return v; }
    try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch { /* quota */ }
    return v;
  })();
  p.catch(() => mem.delete(k));
  mem.set(k, p);
  return p;
}
const R = Math.PI / 180;
const distKm = (a: number, b: number, c: number, d: number) => {
  const h = Math.sin(((c - a) * R) / 2) ** 2 + Math.cos(a * R) * Math.cos(c * R) * Math.sin(((d - b) * R) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// ── Wikidata ────────────────────────────────────────────────────────────────
export interface WikiFacts {
  qid: string; label?: string; description?: string;
  inception?: string; visitors?: { n: number; year?: string }; collection?: number;
  architect?: string[]; director?: string[]; owner?: string[]; style?: string[]; instanceOf?: string[];
  instagram?: string; x?: string; image?: string;
}
const WD = 'https://www.wikidata.org/w/api.php';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Claim = any;
const val = (c: Claim) => c?.mainsnak?.datavalue?.value;
const best = (cl: Claim[] | undefined) => (cl ?? []).filter((c) => c.rank !== 'deprecated').sort((a, b) => (b.rank === 'preferred' ? 1 : 0) - (a.rank === 'preferred' ? 1 : 0));
const ids = (cl: Claim[] | undefined) => best(cl).map((c) => val(c)?.id).filter(Boolean) as string[];

async function wbget(idList: string[], props: string) {
  const u = `${WD}?action=wbgetentities&ids=${idList.join('|')}&props=${props}&languages=en|es&format=json&origin=*`;
  const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).entities ?? {};
}

/** Find the Wikidata item: the OSM tag if present, otherwise a name search confirmed by coordinates (≤ 2 km). */
async function resolveQid(inst: Institution, hint?: string): Promise<string | null> {
  if (hint && /^Q\d+$/.test(hint)) return hint;
  const short = inst.name.split(/\s[—–-]\s|[:(]/)[0].trim() || inst.name;
  const r = await fetch(`${WD}?action=wbsearchentities&search=${encodeURIComponent(short)}&language=en&limit=6&format=json&origin=*`);
  if (!r.ok) return null;
  const hits: { id: string }[] = (await r.json()).search ?? [];
  if (!hits.length) return null;
  const ents = await wbget(hits.map((h) => h.id), 'claims');
  for (const h of hits) {
    const co = val(best(ents[h.id]?.claims?.P625)[0]);
    if (co && distKm(inst.lat, inst.lon, co.latitude, co.longitude) <= 2) return h.id;
  }
  return null;
}

export function loadWiki(inst: Institution, hint?: string): Promise<WikiFacts | null> {
  return cached(`wd.${inst.id}.${hint ?? ''}`, async () => {
    const qid = await resolveQid(inst, hint);
    if (!qid) return null;
    const e = (await wbget([qid], 'claims|labels|descriptions'))[qid];
    if (!e) return null;
    const c = e.claims ?? {};
    const f: WikiFacts = { qid, label: e.labels?.en?.value ?? e.labels?.es?.value, description: e.descriptions?.en?.value ?? e.descriptions?.es?.value };
    const inc = val(best(c.P571)[0]);
    if (inc?.time) f.inception = inc.time.replace(/^\+/, '').slice(0, inc.precision >= 11 ? 10 : inc.precision >= 10 ? 7 : 4);
    // visitors per year: take the most recent point-in-time
    const vis = best(c.P1174).map((x) => ({ n: Math.round(+val(x)?.amount), year: x.qualifiers?.P585?.[0]?.datavalue?.value?.time?.slice(1, 5) as string | undefined }))
      .filter((v) => Number.isFinite(v.n)).sort((a, b) => (b.year ?? '').localeCompare(a.year ?? ''));
    if (vis[0]) f.visitors = vis[0];
    const col = val(best(c.P1436)[0]);
    if (col?.amount) f.collection = Math.round(+col.amount);
    f.instagram = val(best(c.P2003)[0]); f.x = val(best(c.P2002)[0]);
    const img = val(best(c.P18)[0]); if (img) f.image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img)}?width=420`;
    // item-valued claims → resolve labels in one call
    const groups = { architect: ids(c.P84).slice(0, 3), director: ids(c.P1037).slice(0, 2), owner: ids(c.P127).slice(0, 2), style: ids(c.P149).slice(0, 2), instanceOf: ids(c.P31).slice(0, 2) };
    const all = [...new Set(Object.values(groups).flat())];
    if (all.length) {
      const labels = await wbget(all, 'labels');
      const lab = (id: string) => labels[id]?.labels?.en?.value ?? labels[id]?.labels?.es?.value ?? id;
      for (const [k, v] of Object.entries(groups)) if (v.length) (f as unknown as Record<string, string[]>)[k] = v.map(lab);
    }
    return f;
  });
}

// ── Wikimedia Commons street-level photographs ─────────────────────────────
export interface Photo { title: string; thumb: string; page: string; m: number; year?: string; author?: string }
export function loadPhotos(lat: number, lon: number, radius = 600, limit = 8): Promise<Photo[]> {
  return cached(`ph.${lat.toFixed(4)},${lon.toFixed(4)}`, async () => {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=${radius}&ggsnamespace=6&ggslimit=30`
      + `&prop=imageinfo|coordinates&iiprop=url|extmetadata&iiextmetadatafilter=DateTimeOriginal|Artist&iiurlwidth=320&format=json&origin=*`;
    const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: any[] = Object.values((await r.json()).query?.pages ?? {});
    return pages
      .filter((p) => /\.(jpe?g|png|webp)$/i.test(p.title) && p.imageinfo?.[0]?.thumburl)
      .map((p) => {
        const ii = p.imageinfo[0], md = ii.extmetadata ?? {};
        const co = p.coordinates?.[0];
        const strip = (s?: string) => s?.replace(/<[^>]+>/g, '').trim();
        return {
          title: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''), thumb: ii.thumburl, page: ii.descriptionurl,
          m: co ? Math.round(distKm(lat, lon, co.lat, co.lon) * 1000) : NaN,
          year: strip(md.DateTimeOriginal?.value)?.match(/\b(18|19|20)\d{2}\b/)?.[0], author: strip(md.Artist?.value)?.slice(0, 40),
        } as Photo;
      })
      .sort((a, b) => (a.m || 1e9) - (b.m || 1e9))
      .slice(0, limit);
  });
}
