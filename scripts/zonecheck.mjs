// verifies: tabs (MAP/NETWORK only), HUD (SAT/TILT only), hot list length + hover arrow,
// target profile REAL blocks (Wikidata, zone cams, street photos) for a few targets.
import { chromium } from 'playwright';
const URL = process.env.URL ?? 'http://localhost:4173/';
const IDS = (process.env.IDS ?? 'malba,tate-modern,broad,sfmoma').split(',');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
console.log('TABS:', await p.evaluate(() => [...document.querySelectorAll('.vbtn')].map((e) => e.textContent).join(' ')));
console.log('HUD :', await p.evaluate(() => [...document.querySelectorAll('.ghud-controls button')].map((e) => e.textContent).join(' ')), '|', await p.evaluate(() => document.querySelector('.ghud-cls')?.textContent));
console.log('HOT :', await p.evaluate(() => document.querySelectorAll('.detail .row').length), 'rows');
const row = await p.$('.detail .row.clk');
if (row) {
  const bb = await row.boundingBox(); await p.mouse.move(bb.x + 40, bb.y + bb.height / 2); await p.waitForTimeout(400);
  console.log('HOVER ▸:', await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const r = e?.closest('.clk'); return r ? getComputedStyle(r, '::before').opacity + ' pad ' + getComputedStyle(r).paddingLeft : 'top element: ' + e?.className; }, [bb.x + 40, bb.y + bb.height / 2]));
  await p.screenshot({ path: '/tmp/zone-hover.png', clip: { x: 0, y: bb.y - 120, width: 420, height: 260 }, timeout: 90000 });
}
await p.screenshot({ path: '/tmp/zone-home.png', timeout: 90000 });
for (const id of IDS) {
  await p.evaluate((i) => window.CICFA.select(i), id);
  await p.waitForTimeout(12000);
  const info = await p.evaluate(() => {
    const pr = document.querySelector('.profile'); if (!pr) return '(no profile)';
    const heads = [...pr.querySelectorAll('.pf-realblock')].map((blk) => {
      const h = blk.querySelector('.pf-h')?.textContent;
      const rows = [...blk.querySelectorAll('.pf-row.real')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()).slice(0, 9);
      const mini = [...blk.querySelectorAll('.mini')].map((m) => m.textContent).join(' / ');
      const imgs = [...blk.querySelectorAll('img')].map((i) => `${i.naturalWidth}x${i.naturalHeight}`).join(',');
      return `  [${h}] ${mini}\n    ${rows.join('\n    ')}\n    imgs: ${imgs}`;
    });
    return heads.join('\n');
  });
  console.log(`\n=== ${id}\n${info}`);
  await p.evaluate(() => { const pr = document.querySelector('.profile'); const blk = [...pr.querySelectorAll('.pf-realblock')][1]; blk?.scrollIntoView(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `/tmp/zone-${id}.png`, timeout: 90000 });
}
console.log('\nERRORS', errs.length); for (const e of errs.slice(0, 8)) console.log(' •', e.slice(0, 160));
await b.close();
