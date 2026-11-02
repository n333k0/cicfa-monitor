import { chromium } from 'playwright';
const URL = process.env.URL ?? 'http://localhost:4173/';
const b = await chromium.launch(process.env.GPU ? { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && !/GL Driver|GPU stall/.test(m.text()))) errs.push(m.type() + ': ' + m.text()); });
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.evaluate(() => [...document.querySelectorAll('.vbtn')].find((e) => e.textContent === 'GLOBE')?.click());
await p.waitForTimeout(5000);
await p.screenshot({ path: '/tmp/globe.png', timeout: 90000 });
if (process.env.SEL) { await p.evaluate((i) => window.CICFA.select(i), process.env.SEL); await p.waitForTimeout(4000); await p.screenshot({ path: '/tmp/globe-sel.png', timeout: 90000 }); }
console.log('ERRORS', errs.length); for (const e of errs.slice(0, 5)) console.log(' •', e.slice(0, 200));
await b.close();
