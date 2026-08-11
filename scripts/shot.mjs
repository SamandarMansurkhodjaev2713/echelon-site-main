/*
 * Ad-hoc visual inspection. Walks the page in viewport-height steps and writes
 * numbered PNGs so the whole scroll can be reviewed as a filmstrip.
 *
 *   node scripts/shot.mjs [url] [outdir] [width] [height]
 */
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321/echelon-site-main/';
const out = process.argv[3] ?? '.shots';
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800); // let the intro finish

const total = await page.evaluate(() => document.documentElement.scrollHeight);
const steps = Math.ceil(total / height);
console.log(`page height ${total}px → ${steps} frames at ${width}×${height}`);

for (let i = 0; i < steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * height);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}.png` });
}

if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
await browser.close();
