/* Focused look at the voice section, with the recording actually playing. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:4321/echelon-site-main/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
mkdirSync('.shots', { recursive: true });

await page.locator('#voice').scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await page.screenshot({ path: '.shots/voice-idle.png' });

await page.locator('[data-voice-play]').click();
await page.waitForTimeout(2600);
await page.screenshot({ path: '.shots/voice-playing.png' });

console.log('core canvas:', await page.locator('[data-voice-core]').evaluate((c) => `${c.width}x${c.height}`));
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
await browser.close();
