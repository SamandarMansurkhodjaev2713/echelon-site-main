/*
 * Lighthouse against the production build, under mobile throttling.
 * Usage: node scripts/lighthouse.mjs [url]
 *
 * The preview server must already be running (npm run preview).
 */
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:4321/echelon-site/';
const FORM_FACTOR = process.env.FORM_FACTOR || 'mobile';
const PORT = 9222;

const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });

const result = await lighthouse(URL, {
  port: PORT,
  output: 'json',
  logLevel: 'error',
  formFactor: FORM_FACTOR,
  screenEmulation:
    FORM_FACTOR === 'mobile'
      ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
      : { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
  throttlingMethod: 'simulate',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
});

const lhr = result.lhr;
const scores = Object.fromEntries(
  Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]),
);
const metric = (id) => lhr.audits[id]?.displayValue ?? lhr.audits[id]?.numericValue;

console.log(`\n=== ${FORM_FACTOR.toUpperCase()} — ${URL} ===`);
console.log('scores        ', JSON.stringify(scores));
console.log('FCP           ', metric('first-contentful-paint'));
console.log('LCP           ', metric('largest-contentful-paint'));
console.log('TBT           ', metric('total-blocking-time'));
console.log('CLS           ', metric('cumulative-layout-shift'));
console.log('Speed Index   ', metric('speed-index'));
console.log('LCP element   ', lhr.audits['largest-contentful-paint-element']?.displayValue ?? '—');
console.log('transfer      ', lhr.audits['total-byte-weight']?.displayValue);

const failing = Object.entries(lhr.audits)
  .filter(([, a]) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
  .map(([id, a]) => `  ${id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
if (failing.length) console.log('\nAudits below 0.9:\n' + failing.join('\n'));

fs.mkdirSync('.lighthouse', { recursive: true });
fs.writeFileSync(`.lighthouse/${FORM_FACTOR}.json`, JSON.stringify(lhr, null, 2));
await browser.close();
