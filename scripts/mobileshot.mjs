// Mobile check for v2: 390×844 (iPhone 14) at 3×, home + each tab + profile + index. MOBILE_TAG names the run.
import { chromium } from 'playwright';
const URL = process.env.URL ?? 'http://localhost:4173/v2/';
const TAG = process.env.TAG ?? 'm';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
await p.screenshot({ path: `/tmp/${TAG}-home.png` });
const tabs = await p.$$('.mtabs button');
for (let i = 0; i < tabs.length; i++) {
  await tabs[i].tap(); await p.waitForTimeout(700);
  await p.screenshot({ path: `/tmp/${TAG}-tab${i}.png` });
}
if (tabs.length) { await tabs[tabs.length - 1].tap(); await p.waitForTimeout(300); }
await p.evaluate(() => window.CICFA.select('malba')); await p.waitForTimeout(6000);
await p.screenshot({ path: `/tmp/${TAG}-profile.png` });
await p.evaluate(() => window.CICFA.select(null)); await p.waitForTimeout(400);
const idx = await p.$('.rail-btn[aria-label="Master index"]');
if (idx) { await idx.tap(); await p.waitForTimeout(800); await p.screenshot({ path: `/tmp/${TAG}-index.png` }); }
console.log('overflowX', await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), 'tabs', tabs.length, 'ERRORS', errs.length, errs.slice(0, 3).join(' | '));
await b.close();
