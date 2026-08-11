import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4321/echelon-site-main/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// What is the black thing pinned at the bottom-centre of every frame?
const atPoint = await page.evaluate(() => {
  const els = document.elementsFromPoint(720, 890);
  return els.slice(0, 6).map((e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return `${e.tagName}.${e.className || '-'} pos=${cs.position} rect=${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  });
});
console.log('AT (720,890):\n' + atPoint.join('\n'));

// Section inventory: height, background, and how much of the width is used
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('main > section')].map((s) => {
    const r = s.getBoundingClientRect();
    return {
      id: s.id || s.className.split(' ')[0],
      h: Math.round(r.height),
      bg: getComputedStyle(s).backgroundColor,
    };
  }),
);
console.table(sections);
console.log('total height', await page.evaluate(() => document.documentElement.scrollHeight));

await browser.close();
