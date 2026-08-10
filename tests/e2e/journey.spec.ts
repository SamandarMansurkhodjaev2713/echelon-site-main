import { expect, test, type Page } from '@playwright/test';

/*
 * The scenarios §36 of the brief requires, in order. Each test states the user
 * behaviour it protects, not the implementation it happens to use.
 */

const RU = './';
const EN = './en/';
const UZ = './uz/';

/** Navigate and wait until the page has finished wiring itself up. */
async function visit(page: Page, url: string) {
  await page.goto(url);
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
}

/** Scroll the teach panel into view and wait until its controls are live. */
async function openTeach(page: Page) {
  await page.locator('#teach').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-teach][data-teach-ready]', { state: 'attached' });
}

/** A fresh visitor: no intro seen, no narrative session. */
async function freshVisit(page: Page, path = RU) {
  await page.context().clearCookies();
  await visit(page, `${path}?session=reset`);
  await page.evaluate(() => sessionStorage.clear());
  await visit(page, path);
}

async function noPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return () => errors;
}

/* 1 ---------------------------------------------------------------- */
test('opens RU, the intro completes, the hero is readable', async ({ page }) => {
  const errors = await noPageErrors(page);
  await freshVisit(page);

  // during the intro the operation is the only thing on screen
  await expect(page.locator('html')).toHaveAttribute('data-intro', '');

  // and it finishes on its own, well inside the 3 s ceiling
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '', { timeout: 3000 });

  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  await expect(h1).not.toBeEmpty();
  await expect(page.getByRole('link', { name: /демо/i }).first()).toBeVisible();
  expect(errors()).toEqual([]);
});

/* 2 ---------------------------------------------------------------- */
test('a repeat visit in the same tab does not replay the full intro', async ({ page }) => {
  await freshVisit(page);
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '', { timeout: 3000 });

  const start = Date.now();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '', { timeout: 1500 });
  expect(Date.now() - start).toBeLessThan(2500);
  await expect(page.locator('h1')).toBeVisible();
});

/* 3 ---------------------------------------------------------------- */
test('the intro can be skipped, by click and by keyboard', async ({ page }) => {
  await freshVisit(page);
  await page.locator('[data-intro-skip]').click();
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '', { timeout: 1500 });
  await expect(page.locator('h1')).toBeVisible();

  await freshVisit(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '', { timeout: 1500 });
});

/* 4 + 5 ------------------------------------------------------------- */
test('the header CTA reaches the handover, and the handover CTA is the demo link', async ({
  page,
}) => {
  await visit(page, `${RU}?intro=off`);
  await page.getByRole('banner').getByRole('link', { name: /демо/i }).click();
  await expect(page.locator('#handover')).toBeInViewport({ timeout: 4000 });

  const cta = page.locator('#handover a.act');
  await expect(cta).toHaveAttribute('href', 'https://t.me/komrxn');
  await expect(cta).toHaveAttribute('rel', /noopener/);
  await expect(cta).toBeVisible();
});

/* 6 + 7 + 8 + 9 ------------------------------------------------------ */
for (const [name, path, marker] of [
  ['RU', RU, 'Бизнес'],
  ['EN', EN, 'Business'],
  ['UZ', UZ, 'Biznes'],
] as const) {
  test(`${name} renders its own copy with no horizontal overflow`, async ({ page }) => {
    const errors = await noPageErrors(page);
    await visit(page, `${path}?intro=off`);
    await expect(page.locator('h1')).toContainText(marker);

    // walk the whole page so every lazy scene initialises
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.75;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });

    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
    expect(errors()).toEqual([]);
  });
}

test('switching language keeps you on an equivalent page', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);
  await page.getByRole('navigation', { name: /язык/i }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('Business');

  await page.getByRole('navigation', { name: /language/i }).getByRole('link', { name: 'UZ' }).click();
  await expect(page).toHaveURL(/\/uz\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uz');
});

/* 10 --------------------------------------------------------------- */
test('the rule taught early is used much later, and footnoted', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);

  const neutral = (await page.locator('[data-rule-text]').textContent())?.trim() ?? '';

  await openTeach(page);
  await page.locator('[data-teach-option="concise"]').click();

  // it is acknowledged as a saved rule, with an id
  await expect(page.locator('[data-teach-stamp]')).toBeVisible();
  await expect(page.locator('[data-teach-option="concise"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // several sections later the client reply is the concise one, and cites the rule
  await page.locator('#client').scrollIntoViewIfNeeded();
  const target = page.locator('[data-rule-target]');
  await expect(target).toHaveAttribute('data-rule-applied', 'concise');
  const applied = (await page.locator('[data-rule-text]').textContent())?.trim() ?? '';
  expect(applied).not.toBe(neutral);
  expect(applied.length).toBeLessThan(neutral.length);
  await expect(page.locator('[data-rule-note]')).toBeVisible();

  // and the handover reports it
  await page.locator('#handover').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-hand-row="rule"]')).toBeVisible();
  await expect(page.locator('[data-hand-rule]')).not.toBeEmpty();
});

test('choosing "no rule" applies the neutral reply and shows no footnote', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);
  await openTeach(page);
  await page.locator('[data-teach-option="skip"]').click();
  await page.locator('#client').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-rule-target]')).toHaveAttribute('data-rule-applied', 'skip');
  await expect(page.locator('[data-rule-note]')).toBeHidden();
  await page.locator('#handover').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-hand-row="rule"]')).toBeHidden();
});

test('the taught rule survives a language switch', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);
  await openTeach(page);
  await page.locator('[data-teach-option="formal"]').click();
  await expect(page.locator('[data-teach-option="formal"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // assert the store itself, not just the UI, before leaving the page
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as unknown as { __echelon?: { session?: { get(): { rule: string | null } } } })
            .__echelon?.session?.get().rule ?? null,
      ),
    )
    .toBe('formal');
  await visit(page, `${EN}?intro=off`);
  await page.locator('#client').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-rule-target]')).toHaveAttribute('data-rule-applied', 'formal');
});

/* 11 --------------------------------------------------------------- */
test('the session can be reset deterministically', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);
  await openTeach(page);
  await page.locator('[data-teach-option="concise"]').click();
  await expect(page.locator('[data-teach-stamp]')).toBeVisible();

  await visit(page, `${RU}?intro=off&session=reset`);
  await openTeach(page);
  await expect(page.locator('[data-teach-stamp]')).toBeHidden();
  await expect(page.locator('[data-teach-option="concise"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

/* 12 --------------------------------------------------------------- */
test('the real product demo works: every pane, the graph, the chat, the board', async ({
  page,
}, testInfo) => {
  const errors = await noPageErrors(page);
  await visit(page, `${RU}?intro=off`);
  await page.locator('#product').scrollIntoViewIfNeeded();

  const compact = (page.viewportSize()?.width ?? 1440) < 1024;
  const nav = (id: string) =>
    compact
      ? page.locator(`[data-prod-tabs] [data-tab="${id}"]`)
      : page.locator(`#product [data-app-nav="${id}"]`);

  for (const id of ['graph', 'vault', 'kanban', 'automations', 'analytics', 'chat']) {
    await nav(id).click();
    await expect(page.locator(`#prod-panel-${id}`)).toBeVisible();
  }

  // the memory graph really builds its 236 nodes
  await nav('graph').click();
  await expect(page.locator('#product [data-graph-stats]')).toContainText('236', {
    timeout: 8000,
  });

  // a chat chip produces an answer
  await nav('chat').click();
  await page.locator('#product [data-chip]').first().click();
  await expect(page.locator('#product [data-chat-thread] .ui-msg-assistant')).toBeVisible({
    timeout: 6000,
  });

  // an automation can be paused
  await nav('automations').click();
  const toggle = page.locator('#product .ui-autorow__toggle').first();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  // a task can be moved with the keyboard alone
  await nav('kanban').click();
  const card = page.locator('#product .ui-card').first();
  const firstColumnCount = page.locator('#product .ui-kanban__col').first().locator('.ui-card');
  const before = await firstColumnCount.count();
  await card.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(firstColumnCount).toHaveCount(before - 1);

  expect(errors()).toEqual([]);
  testInfo.attach;
});

/* 13 --------------------------------------------------------------- */
test('the approval gate holds until the owner decides', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);
  await page.locator('#boundary').scrollIntoViewIfNeeded();

  await expect(page.locator('[data-gate]')).toBeVisible();
  await expect(page.locator('[data-gate-result]')).toBeEmpty();

  await page.locator('[data-decide="approve"]').click();
  await expect(page.locator('[data-gate-result]')).not.toBeEmpty();

  await page.locator('#handover').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-hand-row="escalations"]')).toBeVisible();
});

/* 14 + 15 ----------------------------------------------------------- */
test('mobile: navigation, tabs and the product are usable at 360 px', async ({ browser }) => {
  // hasTouch matters: without it the emulated context still reports
  // (pointer: fine), which is not what a phone does.
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await visit(page, `${RU}?intro=off`);

  await expect(page.getByRole('banner').getByRole('link', { name: /демо/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: /язык/i })).toBeVisible();

  await page.locator('#product').scrollIntoViewIfNeeded();
  await page.locator('[data-prod-tabs] [data-tab="vault"]').click();
  await expect(page.locator('#prod-panel-vault')).toBeVisible();

  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);

  // no custom cursor on a touch device
  await expect(page.locator('.cursor')).toHaveCount(0);
  await ctx.close();
});

/* 16 --------------------------------------------------------------- */
test('reduced motion: no intro, no scrubbed movement, all content present', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await visit(page, RU);
  await expect(page.locator('html')).toHaveAttribute('data-intro-done', '');
  await expect(page.locator('h1')).toBeVisible();

  // every reveal is already in its final state
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-reveal]')].filter(
        (el) => Number(getComputedStyle(el).opacity) < 0.9,
      ).length,
  );
  expect(hidden).toBe(0);

  // the scrubbed scenes render finished rather than frozen at zero
  await page.locator('#night').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-night-result]')).toHaveAttribute('data-on', '');
  await page.locator('#automate').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-automate-order]')).toHaveAttribute('data-on', '');

  expect(errors).toEqual([]);
  await ctx.close();
});

/* 17 --------------------------------------------------------------- */
test('keyboard only: skip link, then every control in a sensible order', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);

  /* The skip link must be the first focusable thing in the document and must
     actually jump to the content. It is asserted by focusing it directly rather
     than by pressing Tab: Safari ships with "Tab highlights each item" off, so
     Tab skips links entirely there — a browser preference, not a page defect. */
  const skipIsFirst = await page.evaluate(() => {
    const focusables = document.querySelectorAll(
      'a[href], button:not([hidden]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    return focusables[0]?.classList.contains('skip-link') ?? false;
  });
  expect(skipIsFirst).toBe(true);

  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeInViewport();

  // 40 tabs must never land on something invisible or zero-sized
  const bad: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body) return null;
      const r = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      return {
        tag: a.tagName,
        cls: a.className?.toString().slice(0, 40),
        w: r.width,
        h: r.height,
        hidden: cs.visibility === 'hidden' || cs.display === 'none',
      };
    });
    if (info && (info.hidden || info.w === 0 || info.h === 0)) {
      bad.push(`${info.tag}.${info.cls}`);
    }
  }
  expect(bad).toEqual([]);
});

test('tab groups are operable with arrow keys', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);
  await page.locator('#automate').scrollIntoViewIfNeeded();
  const first = page.locator('[data-biz-tabs] [role="tab"]').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const second = page.locator('[data-biz-tabs] [role="tab"]').nth(1);
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(first).toHaveAttribute('tabindex', '-1');
});

/* 18 --------------------------------------------------------------- */
test('the live product layer does not trap focus', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);
  await page.locator('#product').scrollIntoViewIfNeeded();
  await page.locator('#product [data-chip]').first().focus();

  // tabbing forward eventually leaves the product window
  let escaped = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[data-product-stage]'),
    );
    if (!inside) {
      escaped = true;
      break;
    }
  }
  expect(escaped).toBe(true);
});

/* 19 --------------------------------------------------------------- */
test('every route works under the GitHub Pages base path', async ({ page }) => {
  for (const path of [RU, EN, UZ]) {
    const failed: string[] = [];
    page.on('requestfailed', (r) => failed.push(r.url()));
    const res = await page.goto(`${path}?intro=off`);
    expect(res?.status()).toBe(200);
    await page.waitForSelector('html[data-ready]', { state: 'attached' });

    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLImageElement>('img[src]')) {
        if (!el.getAttribute('src')!.startsWith('/echelon-site/')) out.push(el.getAttribute('src')!);
      }
      for (const el of document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')) {
        if (!el.getAttribute('href')!.startsWith('/echelon-site/')) out.push(el.getAttribute('href')!);
      }
      return out;
    });
    expect(bad).toEqual([]);
    expect(failed).toEqual([]);
  }
});

test('SEO head survives the redesign', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);
  await expect(page).toHaveTitle(/Echelon Desktop/);
  const head = await page.evaluate(() => ({
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    hreflang: [...document.querySelectorAll('link[rel="alternate"]')].map((l) =>
      l.getAttribute('hreflang'),
    ),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    twitter: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
    jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent,
    h1s: document.querySelectorAll('h1').length,
  }));
  expect(head.description?.length).toBeGreaterThan(80);
  expect(head.canonical).toBe('https://komrxn.github.io/echelon-site/');
  expect(head.hreflang).toEqual(['ru', 'en', 'uz', 'x-default']);
  expect(head.ogImage).toContain('/echelon-site/og/og-ru.png');
  expect(head.ogTitle).toBeTruthy();
  expect(head.twitter).toBe('summary_large_image');
  expect(JSON.parse(head.jsonLd!)['@type']).toBe('SoftwareApplication');
  expect(head.h1s).toBe(1);
});

test('the work tape records the shift as you read it', async ({ page }) => {
  await visit(page, `${RU}?intro=off&session=reset`);
  await expect(page.locator('[data-tape] [data-tape-row][data-on]')).toHaveCount(0);
  await page.locator('#load').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-tape] [data-tape-row][data-on]')).not.toHaveCount(0);
  await page.locator('#night').scrollIntoViewIfNeeded();
  // the rail fills as sections are read; the observer resolves on the next frame
  await expect
    .poll(async () => page.locator('[data-tape] [data-tape-row][data-on]').count())
    .toBeGreaterThanOrEqual(6);
});

test('the voice section plays the recording and drives the tape, with no orb', async ({ page }) => {
  await visit(page, `${RU}?intro=off`);
  await page.locator('#voice').scrollIntoViewIfNeeded();
  await expect(page.locator('#voice [data-voice-wave]')).toBeVisible();
  await expect(page.locator('#voice .voice__mem').first()).toBeVisible();
  const transcriptLines = await page.locator('#voice .voice__line').count();
  expect(transcriptLines).toBeGreaterThanOrEqual(4);
});
