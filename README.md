# Echelon Desktop — site

Presentation site for **Echelon Desktop**, a personal assistant for the owner of
a business: it lives on their computer, remembers their people and agreements,
runs the routine and finishes it, and leaves the decisions to them.

**Live:** https://komrxn.github.io/echelon-site/ · RU · EN · UZ

---

## The idea

The site is not *about* the product. It behaves like a shift of it. Events
arrive, get classified, get acted on and get remembered; one of them stops at a
boundary because a human has to decide it; and the last screen hands the shift
back with a report of what happened while *you* were on the page — including the
rule you taught it near the top.

Design notes live in `docs/`:

| Document | What it is |
|---|---|
| `docs/redesign-baseline.md` | The audited state before the redesign, and the list of things that must not be lost |
| `docs/redesign-plan.md` | Art direction, interaction grammar, code architecture, OLD→NEW table |
| `docs/redesign-progress.md` | Phase-by-phase log: what changed, why, what was tested |

---

## Stack

Astro 5, static output. No UI framework, no animation engine, no CSS framework.

```
src/i18n/        ru.ts is the source of truth; Dict = typeof ru type-enforces
                 en.ts and uz.ts against it
src/motion/      tokens · media · lifecycle · reveal · scroll · cursor · intro ·
                 tape · tabs · teach · product · voice
src/session/     narrative session state (local only, nothing leaves the browser)
src/components/  one per section, plus ui/ for the recreated product
src/styles/      tokens.css · base.css · ui.css
worker/          Cloudflare Worker for the live voice session (dormant — see below)
```

**Runtime dependencies: none beyond Astro and three webfonts.** Scroll scrubbing
is a 60-line module (`src/motion/scroll.ts`) rather than GSAP + ScrollTrigger,
which the previous version shipped at 46 KB gzipped on every desktop visit.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build → dist/
npm run preview        # serve the build
npm run check          # astro check (types + templates)
npm run test:unit      # vitest — session, i18n, motion tokens
npm run test:e2e       # playwright — journeys, accessibility, visual regression
npm run test:all       # all of the above
npm run contrast       # WCAG contrast validator for the palette
```

Useful scripts:

```bash
node scripts/serve-gzip.mjs      # serves dist/ with gzip, like GitHub Pages does
node scripts/lighthouse.mjs      # Lighthouse against the running server
node scripts/audit-baseline.mjs  # console/overflow/screenshot sweep, 3 locales × 6 viewports
node scripts/overflow-probe.mjs  # names the element that widens the page
```

## Testing

- **Unit** (Vitest): session state machine, storage versioning and corruption
  handling, plural rules, dictionary parity and layout budgets, motion-token ↔
  CSS-variable sync.
- **E2E** (Playwright, 5 projects): Chromium, Firefox, WebKit, Pixel 7 and a
  360 px phone. Covers the intro, repeat visits, all three locales, the taught
  rule being applied six sections later, the approval gate, the walkable
  product, keyboard-only operation and the GitHub Pages base path.
- **Accessibility**: axe-core, WCAG 2.1 A/AA, on every locale and every product
  pane.
- **Visual regression**: 51 baselines across five viewports, taken at pinned
  scroll offsets with motion frozen so scrubbed scenes are captured at a defined
  frame.

Visual baselines are single-engine (Chromium) on purpose — cross-engine font
rasterisation would report noise as regressions.

## Voice

The recorded product voice (RU/EN mp3) plays on the page. A **live** Gemini
session also exists but is dormant: `src/lib/config.ts` has an empty
`VOICE_WORKER_URL`, so the Talk button stays hidden. Deploy `worker/` (see
`worker/README.md`), put its URL in `config.ts`, rebuild, and the button appears.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`. The site is served from `/echelon-site/`, so
every asset URL is built through `asset()` / `localePath()` in `src/i18n` —
never hardcode a leading `/`.
