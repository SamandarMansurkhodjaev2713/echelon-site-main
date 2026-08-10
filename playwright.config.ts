import { defineConfig, devices } from '@playwright/test';

/*
 * E2E runs against the *production build* served by `astro preview`, not the
 * dev server: the redesign's budget claims and GitHub Pages base path only mean
 * something on built output.
 */
const PORT = 4321;
/* Trailing slash matters: relative test paths resolve against it, and the
   deployed site lives under a base path, not at the origin root. */
export const BASE = `http://localhost:${PORT}/echelon-site/`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
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
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE,
    /* Never reuse: a server left running from an earlier session serves a stale
       build, and the suite then passes against code that no longer exists. */
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
