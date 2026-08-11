import { expect, test, type Page } from '@playwright/test';

/*
 * The manual-QA checklist (§39), automated.
 *
 * These are the situations that leave a scroll-driven site in a broken state:
 * resizing across a breakpoint mid-scene, rotating, hammering a control,
 * reloading halfway down, and going back. The baseline site failed the first of
 * these outright — resizing below 1000 px left four of five day scenes stuck at
 * opacity 0 — so it is the first test here.
 */

async function ready(page: Page) {
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
}

const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return () => errors;
};

test('resizing across the stage breakpoint leaves no scene stranded', async ({ page }) => {
  const errors = errorsOf(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./?intro=off');
  await ready(page);

  await page.locator('#day').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // down across every breakpoint, then back up
  for (const width of [1200, 1024, 900, 768, 600, 390, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(300);

  /* Only what is actually on screen: a reveal that has not been scrolled into
     view yet is correctly still waiting, not stranded. */
  const stranded = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(
      '#day .day__scene, #day .day__scene *, #night .night__track, #automate .auto__prim',
    )) {
      const r = el.getBoundingClientRect();
      const onScreen = r.top < window.innerHeight && r.bottom > 0 && r.width > 0;
      if (!onScreen) continue;
      const cs = getComputedStyle(el);
      if (Number(cs.opacity) < 0.05 || cs.visibility === 'hidden') {
        out.push(el.className?.toString().slice(0, 40));
      }
    }
    return [...new Set(out)];
  });
  expect(stranded).toEqual([]);
  expect(errors()).toEqual([]);
});

test('rotating a phone keeps the page intact', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const errors = errorsOf(page);
  await page.goto('./?intro=off');
  await ready(page);
  await page.locator('#night').scrollIntoViewIfNeeded();

  await page.setViewportSize({ width: 844, height: 390 }); // landscape
  await page.waitForTimeout(250);
  const landscape = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(landscape.scrollW).toBeLessThanOrEqual(landscape.clientW + 1);

  await page.setViewportSize({ width: 390, height: 844 }); // back to portrait
  await page.waitForTimeout(250);
  await expect(page.locator('h1')).toBeAttached();
  expect(errors()).toEqual([]);
  await ctx.close();
});

test('hammering a control does not desynchronise it', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('./?intro=off&session=reset');
  await ready(page);
  await page.locator('#teach').scrollIntoViewIfNeeded();

  const concise = page.locator('[data-teach-option="concise"]');
  const formal = page.locator('[data-teach-option="formal"]');
  for (let i = 0; i < 8; i++) {
    await concise.click();
    await formal.click();
  }
  // exactly one option is pressed, and it is the last one clicked
  const pressed = await page.locator('[data-teach-option][aria-pressed="true"]').count();
  expect(pressed).toBe(1);
  await expect(formal).toHaveAttribute('aria-pressed', 'true');

  // the chat cannot be made to overlap itself
  await page.locator('#product').scrollIntoViewIfNeeded();
  const chips = page.locator('#product [data-chip]');
  await chips.nth(0).click();
  await chips.nth(1).click({ force: true }).catch(() => {});
  await page.waitForTimeout(2200);
  const answers = await page.locator('#product [data-chat-thread] .ui-msg-assistant').count();
  expect(answers).toBeLessThanOrEqual(2);
  expect(errors()).toEqual([]);
});

test('reloading halfway down restores a working page', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('./?intro=off&session=reset');
  await ready(page);
  await page.locator('#teach').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-teach][data-teach-ready]', { state: 'attached' });
  await page.locator('[data-teach-option="concise"]').click();
  await page.locator('#boundary').scrollIntoViewIfNeeded();

  await page.reload();
  await ready(page);

  // the taught rule survived, and the page still works
  await page.locator('#client').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-rule-target]')).toHaveAttribute('data-rule-applied', 'concise');
  expect(errors()).toEqual([]);
});

test('back and forward navigation between locales keeps state and markup', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('./?intro=off&session=reset');
  await ready(page);
  await page.locator('#teach').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-teach][data-teach-ready]', { state: 'attached' });
  await page.locator('[data-teach-option="formal"]').click();

  await page.goto('./en/?intro=off');
  await ready(page);
  await page.goBack();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.locator('#teach').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-teach-option="formal"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.goForward();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors()).toEqual([]);
});

test('a fast scroll to the bottom and back leaves nothing half-drawn', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('./?intro=off');
  await ready(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);

  const invisible = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
      const r = el.getBoundingClientRect();
      const onScreen = r.top < window.innerHeight && r.bottom > 0;
      if (onScreen && Number(getComputedStyle(el).opacity) < 0.05) {
        out.push(el.className?.toString().slice(0, 40));
      }
    }
    return out;
  });
  expect(invisible).toEqual([]);
  expect(errors()).toEqual([]);
});

test('with JavaScript off the page is still a complete document', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('./');

  const text = await page.locator('body').innerText();
  expect(text).toContain('Бизнес');
  expect(text).toContain('Посмотреть демо');
  expect(text.length).toBeGreaterThan(6000);

  // nothing is left invisible waiting for a script that will never run
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-reveal]')].filter(
        (el) => Number(getComputedStyle(el).opacity) < 0.9,
      ).length,
  );
  expect(hidden).toBe(0);

  // the demo link still gets the visitor to a human
  await expect(page.locator('a[href="https://t.me/komrxn"]').first()).toBeVisible();
  await ctx.close();
});

test('no duplicate ids, broken anchors or missing assets on any locale', async ({ page }) => {
  for (const path of ['./', './en/', './uz/']) {
    const failed: string[] = [];
    page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
    await page.goto(`${path}?intro=off`);
    await ready(page);

    const report = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const anchors = [...document.querySelectorAll('a[href^="#"]')].map((a) =>
        a.getAttribute('href'),
      );
      return {
        duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
        brokenAnchors: anchors.filter((h) => h && h !== '#' && !document.querySelector(h)),
        imagesWithoutDimensions: [...document.querySelectorAll('img')].filter(
          (i) => !i.getAttribute('width') || !i.getAttribute('height'),
        ).length,
        h1Count: document.querySelectorAll('h1').length,
      };
    });

    expect(report.duplicateIds, path).toEqual([]);
    expect(report.brokenAnchors, path).toEqual([]);
    expect(report.imagesWithoutDimensions, path).toBe(0);
    expect(report.h1Count, path).toBe(1);
    expect(failed, path).toEqual([]);
  }
});

test('the page depicts one shift, not two days', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./?intro=off&motion=off');
  await ready(page);
  // The page scrolls smoothly; sampling a clock needs the scroll to land, not travel.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  /* The ambient light, the masthead clock and the load on the attention field are
     all driven by motion/shift.ts, which interpolates between the times sections
     declare. A declared time that goes backwards can only mean the next day —
     right for 23:40 → 00:40, ruinous for anything that revisits an earlier hour.
     The day montage used to declare 09:00 → 19:00 on each of its scenes, so the
     13:00 product section after it landed on day two: at 30 % scroll the page read
     04:39 and drove the ground to near-full night in the middle of the working
     day. Every section was correct on its own, which is why nothing short of
     sampling the clock down the whole page finds it. */
  /* Sampled inside the page in one round trip. Driving 25 scroll-and-read steps
     from the test process is 50 crossings of the driver boundary, which is slow
     enough to hit the test timeout on a loaded machine — and waiting on frames
     the clock actually renders is more precise than waiting on a stopwatch. */
  const steps = 24;
  const samples = await page.evaluate(async (n) => {
    const out: number[] = [];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const settled = () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let i = 0; i <= n; i++) {
      window.scrollTo(0, (max * i) / n);
      await settled();
      await settled();
      out.push(Number(document.documentElement.dataset.shiftMinutes));
    }
    return out;
  }, steps);

  expect(Number.isFinite(samples[0]), 'the shift clock never reported a time').toBe(true);
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i]!, `the clock went backwards at step ${i} of ${steps}`).toBeGreaterThanOrEqual(
      samples[i - 1]!,
    );
  }
  // one shift, plus the handover the next morning — under a day, end to end
  expect(samples[samples.length - 1]! - samples[0]!).toBeLessThan(24 * 60);
});
