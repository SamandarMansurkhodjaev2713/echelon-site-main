import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:4321/echelon-site-main';
const OUT =
  process.env.OUT ||
  'C:/Users/sam4k/AppData/Local/Temp/claude/C--Users-sam4k/219c013c-7451-4514-9a7a-1f27d9873222/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });

const url = (process.env.URL || `${BASE}/`) + '?intro=off&session=reset';
const w = Number(process.env.W || 1440);
const h = Number(process.env.H || 900);
const prefix = process.env.PREFIX || String(w);

const SECTIONS = (
  process.env.SECTIONS ||
  '#top,#load,#teach,#day,#product,#memory,#automate,#client,#boundary,#night,#voice,#ledger,#handover'
).split(',');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

for (const sel of SECTIONS) {
  const el = await page.$(sel);
  if (!el) {
    console.log('missing', sel);
    continue;
  }
  await el.scrollIntoViewIfNeeded();
  // settle every reveal in view, then let transitions finish deterministically
  await page.waitForTimeout(950);
  const name = sel.replace(/[^a-z0-9]/gi, '_');
  await page.screenshot({ path: path.join(OUT, `${prefix}${name}.png`) });
  console.log('shot', name);
}

if (errors.length) console.log('ERRORS:', errors);
await browser.close();
