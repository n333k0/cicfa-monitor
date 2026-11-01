// Fly to an institution (default MALBA) at street zoom and screenshot. Usage: ID=ar-... node scripts/cityshot.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(process.env.URL || 'http://localhost:5273', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.evaluate((id) => window.CICFA.select(id), process.env.ID || 'malba');
await p.waitForTimeout(+(process.env.WAIT || 14000));
if (process.env.OUT_STEPS) { await p.mouse.move(840, 470); for (let i = 0; i < +process.env.OUT_STEPS; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(250); } await p.waitForTimeout(+(process.env.OUT_WAIT || 8000)); }
await p.screenshot({ path: process.env.SHOT || 'preview-city.png', timeout: 90000 });
console.log('ERRORS', errs.length); for (const e of errs.slice(0, 6)) console.log(' •', e.slice(0, 200));
await b.close();
