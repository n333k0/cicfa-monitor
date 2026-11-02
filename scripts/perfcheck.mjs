// Rough perf probe (swiftshader = CPU-rendered GL, so absolute FPS is low; compare runs relative to each other).
// Measures rAF FPS + CDP main-thread metrics over a window, per view.
import { chromium } from 'playwright';
const URL = process.env.URL ?? 'http://localhost:4173/';
const VIEWS = (process.env.VIEWS ?? 'MAP').split(',');
const SECS = +(process.env.SECS ?? 8);
const b = await chromium.launch(process.env.GPU ? { headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 945 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable');
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
for (const v of VIEWS) {
  await p.evaluate((label) => [...document.querySelectorAll('.vbtn')].find((e) => e.textContent === label)?.click(), v);
  await p.waitForTimeout(3000);
  const m0 = await metrics();
  const fps = await p.evaluate((secs) => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < secs * 1000) requestAnimationFrame(f); else res(n / secs); }; requestAnimationFrame(f); }), SECS);
  const m1 = await metrics();
  const d = (k) => ((m1[k] - m0[k]) / SECS * 1000).toFixed(0);
  console.log(`${v.padEnd(8)} fps ${fps.toFixed(1)} | per-second ms: script ${d('ScriptDuration')} · style ${d('RecalcStyleDuration')} · layout ${d('LayoutDuration')} · task ${d('TaskDuration')} | nodes ${m1.Nodes} heap ${(m1.JSHeapUsedSize / 1e6).toFixed(0)}MB`);
}
console.log('ERRORS', errs.length, errs.slice(0, 3).join(' | '));
await b.close();
