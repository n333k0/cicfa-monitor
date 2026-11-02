import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
// A: default world view with HUD
const hud = await p.evaluate(() => {
  const g = document.querySelector('.ghud'); if (!g) return '(no ghud)';
  return [...g.querySelectorAll('.ghud-rec,.ghud-cls,.ghud-tick,.ghud-coord')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' || ');
});
console.log('HUD:', hud);
await p.screenshot({ path: '/tmp/hud-default.png', timeout: 90000 });
// B: FLIR + satellite + London zoom → cam pins
await p.evaluate(() => window.CICFA_preset('flir'));
await p.evaluate(() => window.CICFA_sat(true));
await p.evaluate(() => window.CICFA_view(-0.0994, 51.5076, 13));
await p.waitForTimeout(8000);
await p.screenshot({ path: '/tmp/hud-flir-london.png', timeout: 90000 });
// C: tilt (oblique) + CRT over BA sat
await p.evaluate(() => window.CICFA_preset('crt'));
await p.evaluate(() => window.CICFA_view(-58.402, -34.577, 15));
await p.waitForTimeout(2000);
await p.keyboard.press('t');
await p.waitForTimeout(7000);
await p.screenshot({ path: '/tmp/hud-tilt-ba.png', timeout: 90000 });
console.log('ERRORS', errs.length); for (const e of errs.slice(0,8)) console.log(' •', e.slice(0,160));
await b.close();
