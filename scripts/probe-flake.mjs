import { firefox } from '@playwright/test';

const BASE = 'http://localhost:4321/echelon-site-main/';
const RUNS = Number(process.env.RUNS || 10);
const browser = await firefox.launch();

let fails = 0;
for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') logs.push(`console: ${m.text()}`);
  });

  await page.goto(`${BASE}?intro=off&session=reset`);
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  // mirror the test exactly
  await page.locator('[data-rule-text]').textContent();
  await page.locator('#teach').scrollIntoViewIfNeeded();

  const before = await page.evaluate(() => ({
    url: location.href,
    ready: document.documentElement.hasAttribute('data-ready'),
    store: !!window.__echelon?.session,
    rule: window.__echelon?.session?.get?.().rule ?? null,
  }));

  const opt = page.locator('[data-teach-option="concise"]');
  await opt.evaluate((el) => {
    el.addEventListener('click', () => ((window).__clicked = (window).__clicked ?? 0, (window).__clicked++), true);
  });
  await opt.click();
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => ({
    clicked: window.__clicked ?? 0,
    rule: window.__echelon?.session?.get?.().rule ?? null,
    hidden: document.querySelector('[data-teach-stamp]')?.hasAttribute('hidden'),
    pressed: document.querySelector('[data-teach-option="concise"]')?.getAttribute('aria-pressed'),
  }));

  const ok = after.hidden === false && after.rule === 'concise';
  if (!ok) {
    fails++;
    console.log(`run ${i} FAIL`, JSON.stringify({ before, after, logs }));
  }
  await ctx.close();
}
console.log(`${RUNS - fails}/${RUNS} ok`);
await browser.close();
