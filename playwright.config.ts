import { defineConfig, devices } from '@playwright/test';

/*
 * E2E runs against the *production build* served by `astro preview`, not the
 * dev server: the redesign's budget claims and GitHub Pages base path only mean
 * something on built output.
 */
/* Overridable because a developer machine may already have something on 4321 —
   another project's dev server, most often. The default is unchanged, so CI and
   the README are unaffected; only a local run needs to pass E2E_PORT. */
const PORT = Number(process.env.E2E_PORT ?? 4321);
/* Trailing slash matters: relative test paths resolve against it, and the
   deployed site lives under a base path, not at the origin root. */
export const BASE = `http://localhost:${PORT}/echelon-site-main/`;

/*
 * Screenshot baselines carry the platform in their file name, and only the win32
 * set is committed. On `ubuntu-latest` Playwright looks for `…-visual-linux.png`,
 * finds nothing and fails all fifty-one as missing snapshots — and since `test`
 * gates `build` and `build` gates `deploy`, that stops the site from deploying
 * rather than reporting a visual regression. So the project runs where its
 * baselines exist. Behaviour and accessibility still run on every engine
 * everywhere, which is what actually gates correctness; `docs/redesign-progress.md`
 * records the two ways to give CI real visual cover and why neither is free.
 */
const HAS_BASELINES = process.platform === 'win32';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 45_000,
  /*
   * The screenshot tolerance is derived, not guessed.
   *
   * It used to be 2 %, which sounds tight and is not: at 1440 × 900 it allows
   * ~26 000 pixels to move. A full-width hairline is ~1 130 px and a timestamp
   * label ~500, so PHASE 16 could add a rule and a time to *every* section and
   * thirty-nine of the fifty-one baselines still reported green while depicting a
   * page that no longer existed. A gate that cannot see that is not a gate.
   *
   * Measured instead: with the suite pinned to one engine, one device scale, fixed
   * viewports and `?motion=off`, a re-run against freshly written baselines is
   * bit-identical — 51/51 pass at `maxDiffPixelRatio: 0, threshold: 0`. The noise
   * floor is zero, so the only question is how much slack to leave, and the answer
   * is: less than the smallest thing worth catching. A bare hairline is 0.0008 of
   * the frame at every viewport in the matrix, so 0.0005 catches it with margin
   * while still absorbing incidental sub-pixel jitter from a future engine bump.
   *
   * `threshold` stays at its default on purpose. Lowering it would make the gate
   * fire on the ambient light ramp, which shifts the paper by 3–5 % per channel —
   * and that ramp already has a stricter, more meaningful gate of its own in
   * `scripts/contrast.mjs`, which checks every stop it can reach, composited.
   */
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.0005 } },
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
  },
  /* Visual baselines are single-engine on purpose: font rasterisation differs
     enough between engines that a shared baseline reports noise as regression.
     Behaviour and accessibility are checked on every engine. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /visual\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } },
      testIgnore: /visual\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
      testIgnore: /visual\.spec\.ts/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /visual\.spec\.ts/ },
    {
      name: 'mobile-small',
      use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 800 } },
      testIgnore: /visual\.spec\.ts/,
    },
    ...(HAS_BASELINES
      ? [
          {
            name: 'visual',
            testMatch: /visual\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: BASE,
    /* Never reuse: a server left running from an earlier session serves a stale
       build, and the suite then passes against code that no longer exists. */
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
