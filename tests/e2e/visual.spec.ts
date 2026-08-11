import { expect, test, type Page } from '@playwright/test';

/*
 * Visual regression (§37).
 *
 * Baselines are captured on one engine only — cross-engine font rasterisation
 * differs enough that a shared baseline would report noise as regressions.
 * Cross-browser correctness is covered by journey.spec.ts and a11y.spec.ts.
 *
 * Every shot is taken from a *pinned scroll offset* with motion frozen, so the
 * scrubbed scenes are captured at a defined frame rather than wherever the
 * animation happened to be.
 */

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
];

/*
 * Scenes worth protecting, with the scroll fraction that defines their frame.
 *
 * `load`, `voice` and `ledger` were absent, and their absence has a history. The
 * worst defect found in this page so far — the ECHELON column of the comparison
 * table sitting off the right edge of a phone, so the section read as proving the
 * opposite of what it says — was in `ledger`, and no baseline was looking at it.
 * The gate was green throughout. It was found by a person scrolling a narrow
 * screen, which is not a repeatable process and does not run in CI.
 *
 * `voice` was the other blind spot, and the largest: the section with the most
 * machinery on the page had no pixel protecting any of it.
 *
 * The core canvas inside `voice` is still masked with the other canvases. Its
 * type is gated instead by `npm run contrast`, which checks the label alphas
 * against every ground the ambient ramp reaches — a stronger guarantee for a
 * colour than one frozen frame, and one that does not depend on the FFT driver
 * being deterministic at rest.
 */
const SCENES = [
  { id: 'top', at: 0 },
  { id: 'load', at: 0.3 },
  { id: 'teach', at: 0.15 },
  { id: 'day', at: 0.2 },
  { id: 'product', at: 0.55 },
  { id: 'memory', at: 0.2 },
  { id: 'automate', at: 0.5 },
  { id: 'client', at: 0.25 },
  { id: 'boundary', at: 0.2 },
  { id: 'night', at: 0.6 },
  /* Far enough down the section to land on the transcript rather than on the
     core: the core is masked, so a frame taken over it is mostly a magenta
     rectangle, and what can actually break here is the row grid, the marked
     citations and the italic that separates the owner's line from the machine's. */
  { id: 'voice', at: 0.78 },
  { id: 'ledger', at: 0.35 },
  { id: 'handover', at: 0.3 },
];

/**
 * Wait for the page *and* for the substrate underneath it.
 *
 * `html[data-ready]` says the page's scripts are wired. It says nothing about
 * whether the attention field has put its one frozen frame on the canvas: that
 * happens only after the occupancy guard is built, which is deliberately deferred
 * past the intro and onto idle. Waiting on `data-ready` alone would record
 * whether the machine happened to be quick on a given run.
 */
async function ready(page: Page) {
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await page.waitForSelector('canvas[data-field][data-field-ready]', { state: 'attached' });
}

async function freeze(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition: none !important;
      animation: none !important;
      caret-color: transparent !important;
    }
    /* the contextual cursor follows the last click; it is behaviour, not layout */
    .cursor { display: none !important; }
    /* The page scrolls smoothly, so park() was aiming at a moving target and had
       to settle it with two scrolls and two waits. Landing instantly makes the
       parked position exact instead of nearly exact. */
    html { scroll-behavior: auto !important; }`,
  });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-reveal]')) el.classList.add('is-in');
  });
}

/**
 * Park the section at a defined fraction of its own scroll range.
 *
 * Done twice on purpose: the first scroll can itself change layout (lazy images
 * decoding, fonts swapping in), and a baseline captured before that settles is
 * a baseline that disagrees with itself on the next run.
 */
async function park(page: Page, id: string, at: number) {
  await page.evaluate(() => document.fonts?.ready);

  const scrollTo = async () => {
    await page.evaluate(
      ([sel, frac]) => {
        const el = document.getElementById(sel as string);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const range = r.height + window.innerHeight;
        window.scrollTo(0, Math.round(top - window.innerHeight + range * (frac as number)));
      },
      [id, at] as const,
    );
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
    );
  };

  await scrollTo();
  await page.waitForTimeout(150);
  await scrollTo();
  await page.waitForTimeout(150);
}

/**
 * Give the handover report every row before the shot.
 *
 * The report shows a row per *kind* of thing that happened and hides the rest,
 * so its height moves in whole rows. Which kinds happened depends on which
 * sections this particular scroll crossed — a viewport-dependent race — and one
 * row more or less pushes everything below it down by its own height, which is
 * how the baseline came to disagree with itself between runs. Filling all five
 * rows makes the height deterministic: observers that fire later can still add
 * ids, but they can no longer add a *row*. The numbers inside keep varying and
 * stay masked; the filled report has its own explicit pixel test below.
 */
async function fillReport(page: Page) {
  await page.waitForFunction(
    () => Boolean((window as unknown as { __echelon?: { session?: unknown } }).__echelon?.session),
  );
  await page.evaluate(() => {
    const s = (
      window as unknown as {
        __echelon: {
          session: {
            teachRule(r: string): void;
            remember(k: string, id: string): void;
          };
        };
      }
    ).__echelon.session;
    s.teachRule('concise');
    for (const kind of ['facts', 'automations', 'actions', 'escalations']) {
      s.remember(kind, `visual-${kind}`);
    }
  });
}

test.describe('visual', () => {
  for (const vp of VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const scene of SCENES) {
        test(scene.id, async ({ page }) => {
          await page.goto('./?intro=off&motion=off&session=reset');
          await ready(page);
          if (scene.id === 'handover') await fillReport(page);
          await freeze(page);
          await park(page, scene.id, scene.at);

          /* Masked, not screenshotted: a canvas paints its own frames, the
             session clock is real time, and the handover report's contents
             depend on which sections this particular scroll crossed. All three
             are asserted behaviourally in journey.spec.ts, and the filled
             report has its own pixel test below with explicit inputs.

             The attention field is exempt, and has to be. It is
             `position: fixed; inset: 0`, so masking it would cover the whole shot
             and every baseline would be one pink rectangle. It earns the exemption
             rather than being waived through: under `?motion=off` it renders a
             single seeded frame and advances no state, so it is a pure function of
             viewport and scroll offset — and it is the one layer this phase added
             that nothing else protects visually. */
          const dynamic = [
            page.locator('canvas:not([data-field]):not([data-band-field])'),
            page.locator('[data-hand-elapsed]'),
          ];
          if (scene.id === 'handover') dynamic.push(page.locator('[data-hand-report]'));

          await expect(page).toHaveScreenshot(`${vp.name}-${scene.id}.png`, {
            mask: dynamic,
            animations: 'disabled',
          });
        });
      }
    });
  }
});

test.describe('visual: session-aware handover', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('reports what the visitor actually did', async ({ page }) => {
    await page.goto('./?intro=off&motion=off&session=reset');
    await ready(page);

    // a fixed sequence of interactions → a fixed report
    await page.locator('#teach').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-teach][data-teach-ready]', { state: 'attached' });
    await page.locator('[data-teach-option="concise"]').click();
    await page.locator('#product').scrollIntoViewIfNeeded();
    await page.locator('#memory').scrollIntoViewIfNeeded();
    await page.locator('#automate').scrollIntoViewIfNeeded();
    await page.locator('#client').scrollIntoViewIfNeeded();
    await page.locator('#boundary').scrollIntoViewIfNeeded();
    await page.locator('[data-decide="approve"]').click();
    await page.locator('#night').scrollIntoViewIfNeeded();

    await freeze(page);
    await park(page, 'handover', 0.3);

    await expect(page.locator('#handover')).toHaveScreenshot('handover-session-aware.png', {
      // the elapsed clock is real time; everything else here is deterministic
      mask: [page.locator('[data-hand-elapsed]')],
      animations: 'disabled',
    });
  });
});
