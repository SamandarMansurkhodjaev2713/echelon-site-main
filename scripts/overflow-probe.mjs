/* Find exactly which element widens the page at a given viewport. */
import { chromium, devices } from '@playwright/test';

const BASE = 'http://localhost:4321/echelon-site-main/';
const W = Number(process.env.W || 360);
const H = Number(process.env.H || 800);
const PANE = process.env.PANE || '';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(`${BASE}?intro=off&session=reset`, { waitUntil: 'networkidle' });

if (PANE) {
  await page.locator('#product').scrollIntoViewIfNeeded();
  await page.locator(`[data-prod-tabs] [data-tab="${PANE}"]`).click();
  await page.waitForTimeout(600);
}

// walk the page so every scene initialises
await page.evaluate(async () => {
  const step = window.innerHeight * 0.6;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 30));
  }
});

const result = await page.evaluate(() => {
  const docW = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
    if (r.right > docW + 1) {
      out.push({
        sel:
          el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (typeof el.className === 'string' && el.className
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : ''),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowX: cs.overflowX,
        parent: el.parentElement?.tagName.toLowerCase() ?? '',
      });
    }
  }
  return {
    scrollW: document.documentElement.scrollWidth,
    clientW: docW,
    bodyScrollW: document.body.scrollWidth,
    offenders: out.slice(0, 25),
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
