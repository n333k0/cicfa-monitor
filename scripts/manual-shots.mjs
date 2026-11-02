// Captures the screenshots used in docs/manual (v2 edition, 2× for print) + element rects for the anatomy page.
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.env.URL ?? 'http://localhost:4173/';
const OUT = 'docs/manual/shots';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const shot = (name, opt = {}) => p.screenshot({ path: `${OUT}/${name}.png`, timeout: 120000, ...opt });
const rect = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }, sel);

await p.goto(BASE + 'v2/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
// inject test (an external agent choosing target + vector + line)
const inj = await p.evaluate(() => {
  const e = window.CICFA.inject({ agentId: 'mercado', vector: 'exfiltration', targetId: 'malba', severity: 4, line: 'donor-list pull from MALBA · Buenos Aires' });
  return e && { agent: e.agentId, vector: e.vector, target: e.targetId, sev: e.severity, line: e.line };
});
console.log('INJECT', JSON.stringify(inj));
await p.waitForTimeout(1500);
await shot('home');
const anatomy = {};
for (const [k, s] of Object.entries({ brand: '.v2-brand', lab: '.col-l .panel', hot: '.detail', region: '.col-l .panel:last-child', buffer: '.rawstream', cls: '.ghud-class', coord: '.ghud-coord', spec: '.v2-spec', telemetry: '.col-r .panel', feed: '.col-r .panel.grow', rail: '.irail', ticker: '.ticker', exfil: '.bytes' })) anatomy[k] = await rect(s);
fs.writeFileSync(`${OUT}/anatomy.json`, JSON.stringify(anatomy, null, 1));
await shot('col-l', { clip: { x: 80, y: 40, width: 296, height: 809 } });
await shot('col-r', { clip: { x: 1304, y: 40, width: 296, height: 809 } });
await p.hover('.rail-btn[aria-label="Globe"]'); await p.waitForTimeout(300);
await shot('rail', { clip: { x: 640, y: 780, width: 400, height: 80 } });
await p.mouse.move(5, 5);
// packets close-up
await p.evaluate(() => window.CICFA_view(-30, 8, 2.7)); await p.waitForTimeout(2500);
await shot('packets', { clip: { x: 560, y: 220, width: 620, height: 440 } });
// target profile
await p.evaluate(() => window.CICFA.select('malba')); await p.waitForTimeout(12000);
await shot('profile');
const pr = await rect('.profile');
await shot('profile-top', { clip: { x: pr[0], y: pr[1], width: pr[2], height: pr[3] } });
for (const [name, h] of [['profile-real2', 'Reconnaissance'], ['profile-street', 'Street level'], ['profile-op', 'Operation'], ['profile-op2', 'Aggressors']]) {
  await p.evaluate((h) => { const el = [...document.querySelectorAll('.profile .pf-h')].find((x) => x.textContent.startsWith(h)); el?.scrollIntoView({ block: 'start' }); }, h);
  await p.waitForTimeout(1200);
  await shot(name, { clip: { x: pr[0], y: pr[1], width: pr[2], height: pr[3] } });
}
// satellite + tilt over Buenos Aires
await p.evaluate(() => window.CICFA.select(null));
await p.evaluate(() => { window.CICFA_view(-58.395, -34.585, 13.6); window.CICFA_sat(true); }); await p.waitForTimeout(2500);
await p.evaluate(() => window.CICFA_tilt()); await p.waitForTimeout(9000);
await shot('sat-tilt');
await p.evaluate(() => { window.CICFA_tilt(); window.CICFA_sat(false); window.CICFA_view(-58.40, -34.60, 12.4); }); await p.waitForTimeout(6000);
await shot('city');
// master index
await p.click('.rail-btn[aria-label="Master index"]'); await p.waitForTimeout(1000);
await shot('index'); await p.keyboard.press('Escape');
// globe + network
await p.click('.rail-btn[aria-label="Globe"]'); await p.waitForTimeout(6000); await shot('globe');
await p.click('.rail-btn[aria-label="Network"]'); await p.waitForTimeout(6000); await shot('network');
// edition I
await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(8000); await shot('v1-home');
console.log('ERRORS', errs.length, errs.slice(0, 3).join(' | '));
await b.close();
