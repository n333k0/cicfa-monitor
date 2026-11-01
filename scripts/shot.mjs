import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:5273';
const browser = await chromium.launch({
  args: [
    '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e.stack || e.message)));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
if (process.env.CLICKVIEW) {
  try { await page.getByText(process.env.CLICKVIEW, { exact: true }).first().click(); } catch (e) { console.log('click fail', e.message); }
  await page.waitForTimeout(4000);
}

const info = await page.evaluate(() => ({
  panels: document.querySelectorAll('.panel').length,
  canvas: document.querySelectorAll('canvas').length,
  rootHTML: document.getElementById('root')?.innerHTML.length,
  bodyText: document.body.innerText.slice(0, 120),
  mapCanvasSize: (() => { const c = document.querySelector('.map-root canvas'); return c ? `${c.width}x${c.height}` : 'none'; })(),
  webgl: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })(),
}));
console.log('INFO', JSON.stringify(info));
console.log('ERRORS', errors.length);
for (const e of errors.slice(0, 10)) console.log(' •', e.split('\n')[0]);

await page.screenshot({ path: 'preview-overview.png' });
await browser.close();
