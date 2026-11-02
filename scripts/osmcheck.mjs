import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(process.env.URL || 'http://localhost:4173', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
await p.evaluate((id) => window.CICFA.select(id), process.env.ID || 'malba');
// wait until the REAL block stops saying "querying" or 18s pass
await p.waitForFunction(() => {
  const el = document.querySelector('.pf-realblock');
  return el && !/querying open sources/.test(el.textContent || '');
}, { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(1500);
const real = await p.evaluate(() => {
  const el = document.querySelector('.pf-realblock');
  if (!el) return '(no .pf-realblock)';
  return [...el.querySelectorAll('.pf-h, .pf-row, .mini')].map(r => r.textContent.replace(/\s+/g,' ').trim()).join('\n');
});
console.log('=== REAL BLOCK ('+(process.env.ID||'malba')+') ===');
console.log(real);
await p.screenshot({ path: process.env.SHOT || 'preview-osm.png', timeout: 90000 });
console.log('ERRORS', errs.length); for (const e of errs.slice(0, 6)) console.log(' •', e.slice(0, 200));
await b.close();
