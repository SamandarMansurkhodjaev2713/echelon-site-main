import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:4321/echelon-site-main';
const OUT = process.argv[2] || 'C:/Users/sam4k/AppData/Local/Temp/claude/C--Users-sam4k/219c013c-7451-4514-9a7a-1f27d9873222/scratchpad/baseline';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-320', width: 320, height: 640 },
];

const LOCALES = [
  { code: 'ru', url: `${BASE}/` },
  { code: 'en', url: `${BASE}/en/` },
  { code: 'uz', url: `${BASE}/uz/` },
];

const report = { console: [], overflow: [], metrics: [], a11y: [], links: [] };

const browser = await chromium.launch();

for (const loc of LOCALES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const msgs = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') msgs.push(`[${m.type()}] ${m.text()}`);
    });
    page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r) => msgs.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`));

    await page.goto(loc.url + '?intro=off&session=reset', { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);

    // horizontal overflow check
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      const docW = de.clientWidth;
      const offenders = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > docW + 1 || r.left < -1) {
          const sel =
            el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
              : '');
          offenders.push({ sel, left: Math.round(r.left), right: Math.round(r.right) });
        }
      }
      return {
        scrollW: de.scrollWidth,
        clientW: docW,
        bodyScrollW: document.body.scrollWidth,
        offenders: offenders.slice(0, 12),
      };
    });
    if (overflow.scrollW > overflow.clientW + 1 || overflow.offenders.length) {
      report.overflow.push({ locale: loc.code, vp: vp.name, ...overflow });
    }

    // full page screenshot
    await page.screenshot({
      path: path.join(OUT, `${loc.code}-${vp.name}.png`),
      fullPage: true,
    });

    if (msgs.length) report.console.push({ locale: loc.code, vp: vp.name, msgs });

    await ctx.close();
  }
}

// Deep single-pass audit on desktop RU
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?intro=off`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
      (h) => `${h.tagName} ${h.textContent.trim().slice(0, 60)}`,
    );
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const imgsNoDim = [...document.querySelectorAll('img')]
      .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
      .map((i) => i.src);
    const imgsNoAlt = [...document.querySelectorAll('img')]
      .filter((i) => i.getAttribute('alt') === null)
      .map((i) => i.src);
    const landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,section[aria-label]')].map(
      (e) => e.tagName.toLowerCase(),
    );
    const anchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href'));
    const brokenAnchors = anchors.filter((h) => h !== '#' && !document.querySelector(h));
    const buttons = document.querySelectorAll('button').length;
    const tabbables = document.querySelectorAll(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ).length;
    const tablist = [...document.querySelectorAll('[role="tablist"]')].map((t) => ({
      hasAriaLabel: !!t.getAttribute('aria-label'),
      tabs: t.querySelectorAll('[role="tab"]').length,
      tabsWithControls: [...t.querySelectorAll('[role="tab"]')].filter((x) =>
        x.getAttribute('aria-controls'),
      ).length,
    }));
    const tablesNoScope = [...document.querySelectorAll('table')].filter(
      (t) => !t.querySelector('th'),
    ).length;
    const smallText = [...document.querySelectorAll('*')]
      .filter((e) => {
        if (!e.textContent?.trim()) return false;
        if (e.children.length) return false;
        const fs = parseFloat(getComputedStyle(e).fontSize);
        return fs > 0 && fs < 12;
      })
      .slice(0, 10)
      .map((e) => `${e.tagName}.${(e.className || '').toString().split(' ')[0]} ${getComputedStyle(e).fontSize}`);
    return {
      headings,
      dupIds,
      imgsNoDim,
      imgsNoAlt,
      landmarks,
      brokenAnchors,
      buttons,
      tabbables,
      tablist,
      tablesNoScope,
      smallText,
      docHeight: document.documentElement.scrollHeight,
    };
  });
  report.a11y.push(info);

  // Perf metrics
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  const perf = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 2500));
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(
      performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]),
    );
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const res = performance.getEntriesByType('resource');
    const byType = {};
    for (const r of res) {
      const t = r.initiatorType;
      byType[t] = byType[t] || { count: 0, bytes: 0 };
      byType[t].count++;
      byType[t].bytes += r.transferSize || 0;
    }
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadEvent: Math.round(nav.loadEventEnd),
      paints,
      lcp: lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : null,
      resources: byType,
      resourceCount: res.length,
      totalTransfer: res.reduce((a, r) => a + (r.transferSize || 0), 0),
    };
  });
  report.metrics.push(perf);

  // ScrollTrigger count after scrolling through
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const scrollState = await page.evaluate(() => ({
    triggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 'n/a (module-scoped)',
    scrollHeight: document.body.scrollHeight,
  }));
  report.metrics.push({ afterScroll: scrollState });

  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2).slice(0, 12000));
