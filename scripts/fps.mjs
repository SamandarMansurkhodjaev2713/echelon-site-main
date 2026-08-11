/*
 * Sustained frame rate during a real scroll.
 *
 * OPEN ITEM #1 of the previous audit was that frame rate had never been measured
 * — the evidence was strong (TBT 0 ms, CLS 0, GSAP removed) but the thing itself
 * was stated rather than shown. PHASE 16 added two canvases, so this stops being
 * a nice-to-have.
 *
 * Method: drive the page with real scroll events at a human rate while sampling
 * requestAnimationFrame deltas in the page. Reports the median and the 95th
 * percentile frame time, plus how many frames exceeded 16.7 ms and 33 ms. The
 * long-frame counts matter more than the mean — an occasional 40 ms frame is what
 * a reader actually perceives as a stutter, and a mean hides it.
 *
 *   node scripts/fps.mjs [url] [cpuThrottle]
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4321/echelon-site/';
const throttle = Number(process.argv[3] ?? 1);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

if (throttle > 1) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
}

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000); // let the intro finish and the guard build

await page.evaluate(() => {
  const w = window;
  w.__frames = [];
  let last = performance.now();
  const tick = (now) => {
    w.__frames.push(now - last);
    last = now;
    w.__raf = requestAnimationFrame(tick);
  };
  w.__raf = requestAnimationFrame(tick);
});

// ~18 s of continuous scrolling, covering the whole page including both canvases.
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const steps = 180;
for (let i = 0; i < steps; i++) {
  await page.mouse.wheel(0, height / steps);
  await page.waitForTimeout(100);
}

const frames = await page.evaluate(() => {
  cancelAnimationFrame(window.__raf);
  return window.__frames;
});

// The first few frames include the observer wiring up; they are not the steady state.
const s = frames.slice(5).sort((a, b) => a - b);
const at = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
const over = (ms) => s.filter((f) => f > ms).length;

console.log(`throttle      ${throttle}x`);
console.log(`frames        ${s.length}`);
console.log(`median        ${at(0.5).toFixed(1)} ms`);
console.log(`p95           ${at(0.95).toFixed(1)} ms`);
console.log(`worst         ${s[s.length - 1].toFixed(1)} ms`);
console.log(`> 16.7 ms     ${over(16.7)}  (${((over(16.7) / s.length) * 100).toFixed(1)} %)`);
console.log(`> 33 ms       ${over(33)}  (${((over(33) / s.length) * 100).toFixed(1)} %)`);

await browser.close();
