// Tap/click test: hits near (not on) an institution dot, a label, then a second target with the profile open.
import { chromium } from 'playwright';
const URL = process.env.URL ?? 'http://localhost:4173/v2/';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [name, opts] of [['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['desktop', { viewport: { width: 1680, height: 945 } }]]) {
  const p = await (await b.newContext(opts)).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6000);
  // zoom into Buenos Aires so dots + labels are on screen
  await p.evaluate(() => window.CICFA_view(-58.40, -34.59, 13.2)); await p.waitForTimeout(5000);
  const proj = (lon, lat) => p.evaluate(([lon, lat]) => {
    const W = innerWidth, H = innerHeight; const z = 13.2, s = 512 * 2 ** z / 360;
    const mx = (l) => (l + 180) * s, my = (a) => { const r = a * Math.PI / 180; return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + r / 2))) * s; };
    return [W / 2 + mx(lon) - mx(-58.40), H / 2 + my(lat) - my(-34.59)];
  }, [lon, lat]);
  const sel = () => p.evaluate(() => document.querySelector('.pf2-name, .pf-name')?.textContent ?? null);
  const tap = async (x, y) => (opts.hasTouch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y));
  // 1) tap ~9px off the MALBA dot
  const [mx, my] = await proj(-58.4028, -34.5769);
  await tap(mx + 7, my + 6); await p.waitForTimeout(2500);
  const r1 = await sel();
  await p.screenshot({ path: `/tmp/tap-${name}-1.png` });
  // 2) with the profile open, tap another institution (Museo Nacional de Bellas Artes) — must still work
  const [bx, by] = await proj(-58.3929, -34.5838);
  await p.evaluate(() => window.CICFA_view(-58.40, -34.59, 13.2)); await p.waitForTimeout(2500);
  await tap(bx + 6, by - 5); await p.waitForTimeout(2500);
  const r2 = await sel();
  await p.screenshot({ path: `/tmp/tap-${name}-2.png` });
  // 3) expand + collapse the phone sheet
  let r3 = '';
  if (opts.hasTouch) { await p.tap('.pf-grip'); await p.waitForTimeout(400); r3 = await p.evaluate(() => document.querySelector('.profile').className); await p.screenshot({ path: `/tmp/tap-${name}-3.png` }); }
  console.log(name, '| near-dot tap →', r1, '| second tap →', r2, '| grip →', r3, '| errors', errs.length);
}
await b.close();
