// Screenshot the MAP at an exact camera. Usage: LON=-58.4 LAT=-34.6 Z=7 node scripts/viewshot.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(process.env.URL || 'http://localhost:5273', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.evaluate(([lon, lat, z]) => window.CICFA_view(lon, lat, z), [+(process.env.LON ?? -58.4), +(process.env.LAT ?? -34.6), +(process.env.Z ?? 7)]);
await p.waitForTimeout(+(process.env.WAIT || 20000));
await p.screenshot({ path: process.env.SHOT || 'preview-view.png', timeout: 90000 });
console.log('ERRORS', errs.length); for (const e of errs.slice(0, 6)) console.log(' •', e.slice(0, 200));
await b.close();
