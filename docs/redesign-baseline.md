# ECHELON — Redesign Baseline (PHASE 0)

Frozen state of the site **before** any redesign work.
Commit: `48222a1` · Astro 5.18.2 · Node 24.13.1 · captured 2026-08-10.

Verification method: production build (`npm run build`) served with `astro preview`,
driven with Playwright/Chromium at 6 viewports × 3 locales, plus JS-disabled,
reduced-motion and keyboard passes. Scripts: `scripts/audit-baseline.mjs`,
`scripts/audit-deep.mjs`.

---

## 1. CURRENT ARCHITECTURE

**Stack.** Astro 5 static output (`output: static`), zero UI framework, no islands
architecture in use — every component is a `.astro` server component that emits
plain HTML + scoped CSS. Behaviour is added by hand-written TypeScript modules
loaded from inline `<script>` tags via dynamic `import()`.

```
astro.config.mjs      site=https://komrxn.github.io  base=/echelon-site
                      i18n: ru (default, unprefixed) | en | uz
                      build.inlineStylesheets: 'auto'
src/pages/            index.astro (ru) · en/index.astro · uz/index.astro
                      — three near-identical files, each hardcodes its locale
src/layouts/Base.astro  <head>, fonts, tokens.css + base.css, IO reveal script
src/components/       SiteHeader, Hero, Before, DayScene, Touch, Words, Pillars,
                      VoiceSection, Honesty, MathSection, FinalCta, SiteFooter
src/components/ui/    AppWindow + 6 panes (Chat, Graph, Vault, Kanban,
                      Automations, Analytics) + icons.ts (inline SVG strings)
src/lib/              day.ts (GSAP pin) · touch.ts (demo wiring) · graph.ts
                      (canvas force graph) · sphere.ts (canvas voice sphere) ·
                      voice.ts · gemini-live.ts · words.ts · config.ts
src/lib/i18n/         ru.ts (source of truth, exports `Dict` type) · en.ts · uz.ts
src/styles/           tokens.css · base.css · ui.css (product-UI scope, 17 KB)
worker/               Cloudflare Worker proxy for Gemini Live (not deployed —
                      VOICE_WORKER_URL is '')
.github/workflows/    deploy.yml → withastro/action@v3 → actions/deploy-pages@v4
```

**Deployment.** GitHub Pages project site. `base: '/echelon-site'` is applied
manually in every component that builds a URL
(`import.meta.env.BASE_URL.replace(/\/$/, '')` — repeated in 5 files).
Any redesign must keep this base-path discipline or every asset 404s on Pages.

**Routing.** Three static pages, no dynamic routes, `trailingSlash: 'ignore'`.
Locale switch = full page navigation. There is no client router.

**Dependency surface** (production): `astro`, `gsap`,
`@fontsource-variable/golos-text`, `@fontsource-variable/jetbrains-mono`,
`@fontsource/spectral`. That's it — no React, no Tailwind, no animation library
beyond GSAP. This is a healthy starting point and should stay this lean.

**No test infrastructure exists.** No unit runner, no E2E, no CI check beyond
"the build succeeded". `npm run build` is currently the only quality gate.

---

## 2. CURRENT UX

Linear scroll narrative, one page, ten sections, one destination
(`#demo` → Telegram `@komrxn`):

| # | Section | Job it does |
|---|---------|-------------|
| 1 | Hero | Positioning + CTA + first look at the real product window |
| 2 | Before | The problem: business runs on the owner's memory |
| 3 | DayScene | "The same day, but you're the owner" — 09:00→23:00 narrative |
| 4 | Touch | The walkable real product (trust anchor) |
| 5 | Words | Natural language → automation, + business-vertical switcher |
| 6 | Pillars | 5 properties: remembers / acts / learns / works at night / yours |
| 7 | Voice | Talk to it; canvas sphere + recorded voice (+ optional live) |
| 8 | Honesty | Boundaries: prepares decisions, doesn't make them |
| 9 | Math | Compare against a human hire, not against software |
| 10 | FinalCta | Book the demo |

**Conversion path.** Two CTAs point at `#demo` (header + hero), the final CTA is
an external Telegram link. Note: the header/hero CTAs jump *past* the whole
narrative to the bottom of a 12 800 px page — they are the only in-page
navigation that exists. There is no nav menu, no anchor list, no progress
indicator. On a 12.8 k px desktop page (13.6 k px mobile) the user has no map.

**What works today:** the copy is genuinely strong, specific and non-generic
(named people, real numbers, explicit limits). The interactive product demo is
the single most persuasive thing on the page.

**What doesn't:** the *shape* is a conventional dark SaaS landing —
navbar → headline → paragraph → button → app screenshot → alternating sections.
The layout could carry any AI product's copy without modification. The site
describes ECHELON's properties; it does not behave like ECHELON.

---

## 3. CURRENT CONTENT (product truth to preserve)

Factual claims currently made on the page — these are the product's truth and
must survive the redesign intact, in all three languages:

- **Positioning:** personal assistant *for the business owner*, not a team tool,
  not a chatbot. One boss, by design (`honesty.paragraphs[1]`).
- **Runs locally:** Windows / macOS / Linux desktop app; memory and data stay on
  the owner's machine, not in someone else's cloud. Reachable from Telegram.
- **Proof line:** "Conceived April 2026. Running daily for its first paying
  client since July." — dated, checkable, must not be inflated.
- **Demo offer:** live 30-minute call, nothing to install, via Telegram @komrxn.
- **Explicit limits:** does not sign contracts, move money, hire or fire.
  Prepares decisions; the owner makes them.
- **Cost framing:** compared against a salaried assistant, not against software.
  Exact price is deliberately not on the page ("we'll name it on the demo").
- **Demo-data disclosure:** the page states twice that the numbers in the
  recreated UI are demonstration data. This is a trust/legal commitment — keep it.
- **Capabilities shown:** morning briefing, chasing reports in each person's own
  messenger, lead capture + drafted reply, end-of-day numbers reconciliation,
  parallel night work with a stated $ cost, natural-language rules, memory of
  people/agreements, voice conversation.
- **Named entities used across scenes:** Алишер (supplier, 14-day terms from
  12 March), Дилшод (lead), Тимур (silent foreman), Зарина (accountant),
  Object Chilanzar, Новая точка (12 of 18 checklist items). These recur in the
  chat chips, the vault and the graph — the redesign can lean on this as real
  narrative continuity.

Copy exists at full parity in **ru / en / uz**; `ru.ts` is the source of truth and
`Dict = typeof ru` type-enforces that en/uz cannot drift structurally.

---

## 4. CURRENT FEATURES (behaviour inventory)

| Feature | Where | Notes |
|---|---|---|
| Locale switch RU/UZ/EN | `SiteHeader` | 3 links, full navigation |
| IO scroll reveal | `Base.astro` | `.reveal` → `.in`, one-shot, unobserved after |
| Pinned day timeline | `day.ts` + GSAP | desktop ≥1000 px, no reduced-motion |
| Scroll-driven clock 09:00→23:00 | `day.ts` | snapped to 5 min, drives progress bar |
| Walkable product demo | `touch.ts` | 6 panes via sidebar (desktop) / pills (mobile) |
| Scripted chat replies | `touch.ts` `initChat` | 3 question chips → typing → answer |
| Interactive memory graph | `graph.ts` | 236 nodes / 358 edges, force sim, zoom, pan, drag, click-card, labels-on-zoom, pauses off-screen |
| Vault filter + note card | `touch.ts` `initVault` | 5 filters, click row → card |
| Kanban drag & drop | `touch.ts` `initKanbanDnd` | pointer events, column counts update |
| Automation toggles | `touch.ts` `initAutomations` | active ⇄ paused |
| Typewriter instruction | `words.ts` | types once on first view, then reveals result |
| Business-vertical switcher | `words.ts` | 4 verticals re-render case list from JSON island |
| Voice sphere (canvas) | `sphere.ts` | 460 nodes, phases idle/listening/thinking/speaking |
| Recorded voice playback | `voice.ts` | mp3 + WebAudio analyser drives sphere |
| Live voice (Gemini) | `voice.ts` + `gemini-live.ts` + worker | **dormant**: `VOICE_WORKER_URL = ''` so the Talk button stays hidden |
| SEO/meta | `Base.astro` | title, description, canonical, 3× hreflang + x-default, OG, Twitter, favicons |

---

## 5. CURRENT ANIMATIONS

1. **CSS `.reveal`** — `opacity .001 → 1`, `translateY(14px) → 0`, 480 ms.
   Applied to 20+ elements. This is *the* generic pattern §14 of the brief bans.
2. **GSAP ScrollTrigger pin** (`day.ts`) — one timeline, `scrub: 0.7`, stage
   `height: 480vh` (measured 4320 px at 900 px viewport), 5 scenes crossfading
   in equal slots; `onUpdate` writes the clock text and the progress bar height.
3. **Typewriter** (`words.ts`) — `setTimeout` recursion, `Math.random()` jitter,
   non-deterministic (a problem for visual regression later).
4. **Canvas sphere** (`sphere.ts`) — continuous rAF, 460 points + ~2 000 neighbour
   pairs, `globalCompositeOperation = 'lighter'`, radial gradient per frame.
5. **Canvas force graph** (`graph.ts`) — rAF sim, alpha decay, spatial hash.
6. **Micro-transitions** — button hover `translateY(-1px)`, tab colour fades,
   `spin-dot` pulse keyframes, composer caret `blink`.

There is **no shared motion vocabulary**: durations and easings are hardcoded
inline in `touch.ts` (`240ms ease`), `words.ts` (`320ms ease`, `180ms ease`) and
partly tokenised in `tokens.css`. Three sources of truth for the same idea.

---

## 6. CURRENT RESPONSIVE BEHAVIOUR

Breakpoints in use, per-component, no system:
`1000px` (day pin on/off, touch tabs hidden), `900px` (voice grid),
`860px` (before grid), `760px` (pillars grid), `720px` (hero/touch bleed, ui.css),
`640px` (footer), `560px` (header brand label).

- **Day scene** degrades to a plain chronological list below 1000 px — a good,
  honest fallback that must be preserved conceptually.
- **Touch demo** swaps the sidebar for a pill tab row below 1000 px; the window
  bleeds ±40 % of the gutter below 720 px; body height fixed 540 px → 460 px.
- **`100vh` is used** in the pinned day scene (`height: 100vh`,
  `calc(100vh - 60px)`, `min-height: 80vh`) — the classic mobile-browser-chrome
  trap. Currently masked because the pin only runs ≥1000 px, but the pattern is
  in the codebase and must not be carried forward.
- **Measured page height:** 12 789 px desktop @1440, 13 570 px mobile @390.

**Measured horizontal overflow @320 px (RU):** `scrollWidth 325 > clientWidth 320`.
Offender: `.site-header__cta` (right edge 325). `.mathsec__table` also exceeds the
viewport but sits inside an `overflow-x:auto` wrapper, so it scrolls internally —
not a page-level bug, but it is an unlabelled scroll region.
360/375/390/768/1280/1440 are clean in all three locales.

---

## 7. CURRENT ACCESSIBILITY

**Good already:**
- Semantic `header`/`main`/`footer`/`nav`, one `h1`, no duplicate `id`s,
  no missing `alt`, no `img` without width/height.
- `:focus-visible` outline is defined globally (2 px gold, 2 px offset) and
  every tabbable element showed it in the keyboard pass.
- `prefers-reduced-motion` block exists: kills `.reveal`, forces
  `scroll-behavior: auto`, clamps all animations/transitions to 0.01 ms, and
  `DayScene` refuses to load the pin module at all. Verified: `.day--pinned`
  absent, page fully readable, 0 errors.
- No-JS: verified — 7 852 chars of text render, h1 and final CTA present,
  `.reveal` resolves to `opacity: 1` via `html.no-js`.
- `aria-live="polite"` on the voice status line; decorative chaos column is
  `aria-hidden`.

**Gaps found:**
1. **No skip link.** First Tab goes to the brand logo; a keyboard user must pass
   the header on every visit.
2. **`role="tablist"` without the contract** — 2 tablists, neither has
   `aria-label`, none of the 10 tabs has `aria-controls`, panels are not
   `role="tabpanel"`, no arrow-key roving tabindex. Screen readers announce
   "tab" and then cannot find the panel.
3. **Kanban drag-and-drop is pointer-only** — cards are non-focusable `div`s.
   No keyboard path to move a card.
4. **Graph canvas is not reachable or described** — 236 nodes of "memory", zero
   text alternative. The most conceptually important demo pane is invisible to
   assistive tech.
5. **9–11 px text inside the recreated UI** (`.ui-side__group` 9 px,
   `.ui-topbar__badge` 9 px, `.ui-proactive__tag` 10 px, `.ui-meta` 10.5 px).
   Faithful to the desktop app, but below any comfortable reading floor on a
   marketing page.
6. **`.mathsec__table` has no `<caption>`/`scope`** and its horizontal scroll
   container is not focusable/labelled.
7. **Vault "rows" are `<button>`s that open a card injected via `innerHTML`** —
   no focus move to the card, no `aria-expanded`, close button labelled only
   `aria-label="close"` (untranslated, hardcoded English).
8. **Language switcher** is `nav[aria-label="Language"]` with bare "RU/UZ/EN" —
   no `lang` attribute on the links, so a screen reader reads them in the page's
   language.

---

## 8. CURRENT PERFORMANCE RISKS

| Risk | Detail |
|---|---|
| **GSAP shipped whole** | `dist/_astro/day.mHdIuke4.js` = **116 KB / 46 KB gzip** — the entire `gsap` core + ScrollTrigger, downloaded on every desktop visit to drive *one* pinned section. Largest script by an order of magnitude (next is 11.7 KB). |
| **Sphere allocates + sorts every frame** | `sphere.ts` line ~256: `Array.from({length: 460}, …).sort(…)` per rAF — a 460-element array allocation and comparison sort 60×/s, plus `globalCompositeOperation='lighter'` over ~2 000 line strokes and 460 arcs. This is the heaviest continuous cost on the page. |
| **Graph sim** | 236 nodes, rebuilds a `Map` spatial hash **every tick** while `alpha > 0.003`; draws 358 edges + 236 arcs + labels each frame. Correctly pauses off-screen via IO. |
| **Two always-on canvases** | Both gated by IntersectionObserver — good — but neither is gated by `prefers-reduced-motion` for its *idle* animation. Reduced-motion users still get a spinning sphere. |
| **Fonts** | 3 families (Golos Variable, JetBrains Mono Variable, Spectral 500 + 500-italic), full `@fontsource` CSS → 20+ woff2 subsets emitted. No `preload` of the critical face, no explicit `font-display` control, no subsetting. |
| **Unused 248 KB asset** | `public/media/logo.png` (247 833 B) is referenced nowhere in `src/`. Shipped to Pages on every deploy. |
| **OG images 100–124 KB** | Fine (not render-blocking) but three of them. |
| **Voice mp3s 695 KB total** | Correctly lazy — only fetched when "play recording" is pressed. |
| **`backdrop-filter: blur(14px)`** on the sticky header — repaints the blurred strip on every scroll frame; measurable on low-end mobile. |
| **CSS bundle 48 KB** | `index.mKTpCjGR.css`, of which `ui.css` is 17.9 KB — loaded on all pages including where the product UI is below the fold. |
| **No LCP element hint** | Hero LCP is the `<h1>` text, dependent on Golos Variable loading; no `preload`, so a font swap is likely mid-load. |

Lighthouse was **not** run for the baseline: on `localhost` with an unthrottled
loopback the numbers are meaningless as a comparison target. Field-realistic
budgets are set in the plan and will be measured against the built output under
CPU/network throttling before sign-off.

---

## 9. CURRENT TECHNICAL RISKS / DEBT

1. **🔴 Confirmed defect — day scene breaks on resize.**
   `initDay()` runs once if `matchMedia('(min-width: 1000px)')` matched at load.
   It never listens for change. Reproduced: load at 1440 px, resize to 900 px →
   `.day--pinned` **stays on**, and GSAP's inline styles remain, leaving
   **4 of 5 day scenes stuck at `opacity: 0`**. A quarter of the narrative
   silently disappears for anyone who resizes, rotates a tablet, or opens
   devtools. Measured: `sceneOpacities: ["0","0","0","0","1"]` after resize.
   No `gsap.matchMedia()`, no `gsap.context()`, no `ScrollTrigger.kill()`.
2. **Clock lies on load.** `DayScene.astro` hardcodes `07:00`, but
   `SCENE_MINUTES` starts at `09:00`. Before the user scrolls, the scene reads
   "07:00 / Сводка уже лежит" while the copy says the brief lands at 9:00.
3. **Three page files duplicated.** `index.astro`, `en/index.astro`,
   `uz/index.astro` are byte-for-byte identical except two lines. Every section
   added/removed must be edited three times — a guaranteed drift source.
4. **Hardcoded Russian inside components.** `UiKanban.astro` hardcodes card meta
   `'⚙ 2 · 1д'`, `'⚙ 1 · 3ч'`, `'2д'`, `'5ч'`, `'вчера'` — these render
   untranslated on the EN and UZ pages. `touch.ts` hardcodes
   `aria-label="close"`. Real localisation bugs, live in production now.
5. **`innerHTML` string assembly** in `graph.ts`, `touch.ts`, `words.ts`. Content
   is escaped (`escapeHtml`) and comes from local dictionaries, so it is not an
   XSS vector today, but it is a fragile pattern and it defeats scoped styles.
6. **No listener cleanup anywhere.** `touch.ts`, `words.ts`, `voice.ts` attach
   listeners and never remove them. `sphere.ts` has a `destroy()` that is never
   called. Harmless on a static page with no client routing — but it means none
   of these modules can be re-initialised.
7. **`(s.fragment as any)`** — 12 casts in `DayScene.astro` because the scene
   fragment union isn't discriminated in the type. Type safety is off precisely
   where the data shapes differ.
8. **`README.md` is stale** — describes "single self-contained index.html +
   anime.js", which was two rewrites ago.
9. **`npm audit`:** 3 advisories (`sharp` high ×4 CVEs via libvips, `esbuild` low
   — dev-server-only, `astro` high transitively via sharp). No `astro:assets`
   image processing is used by this site, so `sharp` is not on any code path
   that runs; still worth resolving during the redesign.
10. **`sitemap.xml` / `robots.txt` are hand-maintained** in `public/` and will
    silently rot if routes change.
11. **`worker/` is dead code in the deployed artifact** — `VOICE_WORKER_URL` is
    `''`, so `gemini-live.ts` is never imported and the Talk button never
    appears. The capability is real but dormant; it must not be deleted by
    accident.

---

## 10. BASELINE MEASUREMENTS (recorded for comparison)

```
Build:            3 pages in 2.40 s, 0 warnings, 0 errors
dist total:       2 147 561 B (of which 695 KB voice mp3, 248 KB unused logo.png)
Largest JS:       day.mHdIuke4.js  116 047 B  (gzip 45.97 KB)  ← gsap+ScrollTrigger
Other JS:         touch 11.7 KB · voice 6.3 KB · words 1.7 KB · 4 loaders ~0.11 KB
CSS:              index.mKTpCjGR.css 48 135 B
HTML:             ru 62 999 B · uz 55 440 B · en 54 263 B
Page height:      12 789 px @1440×900 · 13 570 px @390×844
Console errors:   0 across 3 locales × 6 viewports
Page errors:      0 during full-page scroll + resize
Horizontal overflow: 320 px RU only (325 vs 320) — .site-header__cta
Demo smoke:       6 panes reachable · graph 236 nodes/358 edges · chat chip OK
Tab stops:        22 before wrap · all with visible focus ring
Reduced motion:   pin disabled, height 11 740 px, 0 errors
No-JS:            7 852 chars, h1 + CTA present, reveals visible
```

---

## 11. WHAT MUST NOT BE ACCIDENTALLY LOST

Hard list. Anything here that disappears is a regression, not a redesign.

**Product truth (§3 above) — all of it, in all three locales.**

**Behaviour:**
1. The **real, interactive product window** with all six panes reachable and
   working: chat (with the 3 scripted chips), memory graph (pan/zoom/drag/click),
   vault (filters + record card), kanban (moving a card between columns),
   automations (toggling a rule), analytics (spend chart).
   This is the site's proof-of-existence. It may be re-staged, re-framed and
   re-choreographed; it may not be reduced to a screenshot.
2. The **236-node memory graph** with real labels drawn from the dictionaries.
3. The **day narrative, 09:00 → 23:00**, all five moments with their product
   fragments (briefing / messenger / lead / report / night workers + $ cost).
4. **Voice**: the recorded-voice playback in RU and EN, *and* the dormant live
   Gemini path (`config.ts` → `gemini-live.ts` → `worker/`). The visual carrier
   changes; the capability and the wiring stay.
   → tracked explicitly as OLD→NEW in the plan.
5. **Natural-language → automation** demonstration, including the correction
   beat ("send it by eight and add photos") and the 4-vertical switcher with all
   12 example instructions.
6. **The honesty section** — the explicit list of what it will not do. Removing
   or softening this is a trust regression.
7. **The math table** — comparison against a salaried human, all 5 rows.
8. **The demo-data disclosure**, both occurrences.
9. **Locale switching RU/UZ/EN** at parity, with `Dict` type enforcement.

**Technical:**
10. `base: '/echelon-site'` correctness on every asset, link and fetch — GitHub
    Pages deployment must not break.
11. SEO head block: title, description, canonical, 3× hreflang + x-default, OG
    (incl. the three locale OG images), Twitter card, favicons, theme-color.
12. `robots.txt` + `sitemap.xml` staying in sync with routes.
13. The no-JS baseline: headline, body copy, product explanation, CTA and
    navigation readable with scripts off.
14. The reduced-motion path: content complete, no pin, no parallax.
15. `.github/workflows/deploy.yml` continuing to build and deploy.
16. The `Dict = typeof ru` compile-time locale-parity guarantee.

---

## 12. VERDICT

Engineering quality is **good**: lean deps, honest progressive enhancement, a
genuinely interactive product demo, real i18n with type-enforced parity, clean
console. Three concrete defects exist (resize-breaks-day-scene, clock-lies-on-load,
untranslated Kanban strings) plus the accessibility gaps in §7.

Design is the weak axis. The page is a well-executed *dark premium SaaS landing*:
its structure, its reveal motion and its section rhythm would fit any AI product
unchanged. It **describes** memory, autonomy and learning; it never **demonstrates**
them. The one moment where the site behaves like the product — the walkable
window — is also the single most convincing thing on the page, which is the whole
argument for the redesign direction.

Proceed to PHASE 1 (architecture proposal).
