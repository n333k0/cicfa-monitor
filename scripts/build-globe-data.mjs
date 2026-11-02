// Builds the GLOBE's static data from Natural Earth (public domain) 1:110m:
//  - src/data/landcells.json   land polygons clipped into 8° cells, so each filled
//    triangle stays small enough to follow the sphere (deck.gl tessellates flat)
//  - src/data/countrylabels.json  country name + label point + rank
// Usage: LAND=ne_110m_land.geojson COUNTRIES=ne_110m_admin_0_countries.geojson node scripts/build-globe-data.mjs
// Sources: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
import fs from 'node:fs';
const land = JSON.parse(fs.readFileSync(process.env.LAND ?? '/tmp/ne/land.json', 'utf8'));
const countries = JSON.parse(fs.readFileSync(process.env.COUNTRIES ?? '/tmp/ne/countries.json', 'utf8'));
const CELL = 8;

// Sutherland–Hodgman clip of a ring against an axis-aligned box (convex clip window)
function clip(ring, x0, y0, x1, y1) {
  const edges = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  let out = ring;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    if (!inp.length) break;
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
  }
  return out;
}
const r2 = (v) => Math.round(v * 100) / 100;
const cells = [];
for (const f of land.features) {
  const ring = f.geometry.coordinates[0].slice(0, -1);
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  const [ax, bx, ay, by] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let x = Math.floor(ax / CELL) * CELL; x < bx; x += CELL) {
    for (let y = Math.floor(ay / CELL) * CELL; y < by; y += CELL) {
      const c = clip(ring, x, y, x + CELL, y + CELL);
      if (c.length < 3) continue;
      const pts = c.map((p) => [r2(p[0]), r2(p[1])]);
      pts.push(pts[0]);
      cells.push(pts);
    }
  }
}
fs.writeFileSync('src/data/landcells.json', JSON.stringify(cells));
const labels = countries.features
  .map((f) => ({ n: String(f.properties.NAME).toUpperCase(), x: r2(f.properties.LABEL_X), y: r2(f.properties.LABEL_Y), r: f.properties.LABELRANK }))
  .filter((l) => Number.isFinite(l.x) && Number.isFinite(l.y));
fs.writeFileSync('src/data/countrylabels.json', JSON.stringify(labels));
console.log('land cells', cells.length, 'labels', labels.length);
