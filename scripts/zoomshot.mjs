import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(process.env.URL || 'http://localhost:5273', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.mouse.move(+(process.env.ZX || 855), +(process.env.ZY || 365));
for (let i = 0; i < +(process.env.STEPS || 5); i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(220); }
await p.waitForTimeout(3500);
await p.screenshot({ path: 'preview-overview.png' });
console.log('ERRORS', errs.length);
await b.close();
