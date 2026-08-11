import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/*
 * Accessibility checks (§34).
 *
 * axe-core is loaded from node_modules and injected, rather than adding
 * @axe-core/playwright: it is the same engine with one fewer dependency, and
 * the source is already on disk for the unit tests to read.
 */

const AXE = path.join(process.cwd(), 'node_modules/axe-core/axe.min.js');

/**
 * Put the page in its settled state before auditing.
 * Without this, axe measures colour contrast against elements that are still
 * fading in and reports failures that no user ever sees.
 *
 * Fonts first, and this is not belt-and-braces. `--measure` is `62ch`, and `ch`
 * is the advance of the *current* font's zero glyph — so until the webfont lands,
 * the body measure is 62 characters of the fallback face and resolves to a
 * different pixel width. Anything that reads a box before that is reading a
 * layout the visitor sees for a few hundred milliseconds. It cost a CI run: the
 * measure check read 80 characters on the runner and well under it here, purely
 * because the font arrived at a different moment. Font metrics come out of the
 * file, so once it has loaded every platform agrees.
 */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }`,
  });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-reveal]')) el.classList.add('is-in');
  });
  await page.waitForTimeout(120);
}

async function analyse(page: Page, context?: string) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async (ctx) => {
    // @ts-expect-error injected global
    const results = await window.axe.run(ctx ? document.querySelector(ctx)! : document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return results.violations.map(
      (v: { id: string; impact: string; help: string; nodes: Array<{ target: string[] }> }) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
      }),
    );
  }, context);
}

test.skip(!fs.existsSync(AXE), 'axe-core is not installed');

for (const [name, path_] of [
  ['RU', './'],
  ['EN', './en/'],
  ['UZ', './uz/'],
] as const) {
  test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(`${path_}?intro=off`);
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
    await settle(page);
    const violations = await analyse(page);
    expect(violations).toEqual([]);
  });
}

test('the product window is accessible with every pane open', async ({ page }) => {
  await page.goto('./?intro=off');
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await page.locator('#product').scrollIntoViewIfNeeded();
  await settle(page);

  const compact = (page.viewportSize()?.width ?? 1440) < 1024;
  for (const id of ['chat', 'graph', 'vault', 'kanban', 'automations', 'analytics']) {
    const nav = compact
      ? page.locator(`[data-prod-tabs] [data-tab="${id}"]`)
      : page.locator(`#product [data-app-nav="${id}"]`);
    await nav.click();
    await expect(page.locator(`#prod-panel-${id}`)).toBeVisible();
    const violations = await analyse(page, '#product');
    expect(violations, `pane: ${id}`).toEqual([]);
  }
});

test('the handover report is accessible once it has content', async ({ page }) => {
  await page.goto('./?intro=off&session=reset');
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await page.locator('#teach').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-teach][data-teach-ready]', { state: 'attached' });
  await page.locator('[data-teach-option="concise"]').click();
  await page.locator('#boundary').scrollIntoViewIfNeeded();
  await page.locator('[data-decide="approve"]').click();
  await page.locator('#handover').scrollIntoViewIfNeeded();
  await settle(page);
  const violations = await analyse(page, '#handover');
  expect(violations).toEqual([]);
});

test('interactive targets are large enough to hit', async ({ page }) => {
  await page.goto('./?intro=off');
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await settle(page);

  const small = await page.evaluate(() => {
    const MIN = 24; // WCAG 2.2 AA target size floor
    const out: string[] = [];
    const selector = 'a[href], button, [role="tab"], input, select';
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (el.closest('[hidden]') || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      // inline links in flowing prose are exempt from the target-size rule
      const cs = getComputedStyle(el);
      if (cs.display === 'inline') continue;
      if (r.width < MIN || r.height < MIN) {
        out.push(
          `${el.tagName}.${el.className?.toString().split(' ')[0]} ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
      }
    }
    return out;
  });
  expect(small).toEqual([]);
});

test('body copy stays inside a readable measure', async ({ page }) => {
  await page.goto('./?intro=off');
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  // The one measuring test that was not settling first — see settle() above.
  await settle(page);
  /*
   * §25: art direction must not cost readability.
   *
   * The count is measured, not approximated. It used to divide the box width by
   * a flat `0.5em` guess at average glyph advance, and that made the check
   * quietly font-dependent in the worst way: the width comes from
   * `--measure: 62ch`, which is 62 advances of the *current* font's zero, while
   * the divisor was a constant. Two numbers from two different fonts. They agree
   * by luck while one face is active and disagree the moment another is — which
   * is exactly what happened on the CI runner, where the same paragraph scored 80
   * and scored 77 here.
   *
   * Measuring the element's own text in the element's own font puts both numbers
   * back on the same footing. Whatever face is actually rendering, the box is N
   * of its characters wide and the answer is N — so the check finally measures
   * what it has always claimed to measure, and it means the same thing on every
   * platform.
   */
  const tooWide = await page.evaluate(() => {
    const out: string[] = [];
    const ctx = document.createElement('canvas').getContext('2d')!;
    for (const el of document.querySelectorAll<HTMLElement>('.copy, .lead, p.note')) {
      const text = (el.textContent ?? '').trim();
      // too short to give a stable average advance, and too short to be a measure problem
      if (text.length < 24) continue;
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const advance = ctx.measureText(text).width / text.length;
      if (!(advance > 0)) continue;
      const chars = el.getBoundingClientRect().width / advance;
      if (chars > 80) out.push(`${el.className}: ${Math.round(chars)} chars`);
    }
    return out;
  });
  expect(tooWide).toEqual([]);
});

test('no interactive control sits inside a moving reveal', async ({ page }) => {
  /*
   * A control inside a transform-based reveal slides out from under the pointer
   * while it arrives, so a click aimed at it can land somewhere else. This was
   * a real intermittent failure on the teach panel before it was made static —
   * the rule is now enforced rather than remembered.
   */
  await page.goto('./?intro=off');
  await page.waitForSelector('html[data-ready]', { state: 'attached' });

  const offenders = await page.evaluate(() => {
    const MOVING = ['receive', 'resolve', 'archive', 'escalate', 'handover'];
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
      if (!MOVING.includes(el.dataset.reveal ?? '')) continue;
      const controls = el.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (controls.length) {
        out.push(`${el.dataset.reveal}: ${el.className?.toString().slice(0, 40)}`);
      }
    }
    return out;
  });
  expect(offenders).toEqual([]);
});
