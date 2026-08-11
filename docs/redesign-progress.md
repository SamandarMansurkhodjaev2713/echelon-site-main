# ECHELON Redesign — Progress Log

Short, technical. One block per phase.

---

## PHASE 0 — Audit + baseline ✅

**What changed** — nothing in `src/`. Added `docs/redesign-baseline.md`,
`scripts/audit-baseline.mjs`, `scripts/audit-deep.mjs`. Installed
`@playwright/test` + `vitest` as devDependencies.

**Why** — §1/§55: establish a verified baseline before touching design.

**Tests run** — `npm run build` (3 pages, 0 errors). Playwright: 3 locales ×
6 viewports (console, overflow, screenshots), plus no-JS, reduced-motion,
keyboard, resize, demo smoke.

**Result** — baseline green: 0 console errors, no-JS readable, reduced-motion
correct, demo fully functional (236-node graph, 6 panes).

**Known issues found (carried into the redesign):**
1. 🔴 Day scene breaks on resize below 1000 px — 4 of 5 scenes stuck at
   `opacity: 0`. No `matchMedia`/`context`/cleanup in `day.ts`.
2. Clock renders `07:00` on load; first scene is `09:00`.
3. `UiKanban.astro` hardcodes Russian meta strings → untranslated on /en/ /uz/.
   `touch.ts` hardcodes `aria-label="close"`.
4. Horizontal overflow at 320 px (RU): `.site-header__cta`, 325 vs 320.
5. A11y: no skip link; `role="tablist"` without `aria-controls`/`tabpanel`;
   kanban keyboard-inaccessible; graph canvas has no text alternative;
   9–11 px type inside `.ui`.
6. Perf: GSAP 116 KB (46 KB gzip) on the critical path for one section;
   `sphere.ts` allocates + sorts 460 elements per frame; unused 248 KB
   `logo.png`; no font preload.
7. `npm audit`: sharp/astro high, esbuild low (dev-only). No `astro:assets` in
   use, so not on a runtime path.

**Next** — PHASE 1.

---

## PHASE 1 — Architecture proposal ✅

**What changed** — `docs/redesign-plan.md`. No code.

**Why** — §52: decide art direction, interaction grammar, code layout and the
OLD→NEW replacement table before writing CSS.

**Decisions**
- Art direction: *operations journal (ivory paper + carbon ink) meets the machine
  (existing dark product UI + teal)*. One signal colour, `#B33A1C`, with a
  semantic law: **signal = the owner**; teal = ECHELON's own surface;
  grey = the machine's own meta.
- Six named motion patterns (RECEIVE / RESOLVE / ARCHIVE / ESCALATE / EXPAND /
  HANDOVER) replace the single generic fade-up.
- GSAP kept but taken **off the critical path**: lazy, desktop-only, and only for
  the three genuinely scrubbed scenes. Everything else is IO + CSS.
- **Lenis rejected** (§44 answered in the plan) — it would own the scroll
  position and endanger keyboard/anchor/touch behaviour for no read benefit.
- 3 duplicated page files collapse into `layouts/Landing.astro`.
- New deps: `@playwright/test`, `vitest` — devDependencies only, zero bundle.

**Tests run** — none (no code change).

**Next** — PHASE 2: design tokens, typography, layout foundation.

---

## PHASE 2 — Tokens, typography, layout ✅

**What changed** — `src/styles/tokens.css`, `src/styles/base.css`,
`src/motion/tokens.ts`, `scripts/contrast.mjs`.

**Why** — §17/§29: the colour law and the motion scale are the foundation every
later section leans on; both had to exist before any section was authored.

**Decisions** — the palette was validated against WCAG *programmatically*
(`npm run contrast`) rather than by eye, before it was written into tokens.
Duration/easing tokens live in `motion/tokens.ts` and are mirrored into CSS
custom properties, so JS scrubs and CSS transitions cannot drift apart.

**Tests run** — `scripts/contrast.mjs`, `npm run build`.

**Result** — every ink/paper/signal pair used for text clears AA.

**Next** — PHASE 3–4.

---

## PHASE 3–4 — i18n + motion architecture ✅

**What changed** — new `src/i18n/{index,ru,en,uz}.ts` (old `src/lib/i18n/*`
deleted); `src/motion/{tokens,media,lifecycle,scroll,reveal,cursor,intro}.ts`.

**Why** — §40–43 and §29: one typed dictionary shape with RU as the source of
truth, and one motion layer that owns matchMedia, cleanup and the six patterns —
so a scene cannot leak a listener or strand itself on resize (baseline defect #1).

**Decisions** — `plural()` carries real RU/UZ plural forms instead of a naive
`n === 1`. `lifecycle.register()` is the single cleanup registry. `media.ts`
holds reduced-motion / pointer / breakpoint matchMedia singletons.

**Tests run** — `tests/unit/motion.test.ts`, build.

**Next** — PHASE 5.

---

## PHASE 5 — Intro + hero ✅

**What changed** — `src/motion/intro.ts`, `src/components/Hero.astro`,
`src/motion/scroll.ts`. **GSAP removed entirely** and deleted from
`package.json`.

**Why** — this reverses the PHASE 1 decision to keep GSAP off the critical path.
Once the reveals were on IntersectionObserver and only two scenes were genuinely
scrubbed, GSAP's 46 KB gzip bought nothing that ~40 lines of scrub math did not.
Keeping a dependency for two callers is cost without payment.

**Result** — largest JS chunk **116 KB → 8.2 KB**. No `gsap` reference remains
in `src/` or `package.json`.

**Known issue found** — short sections never reached scrub progress 1.0; fixed
with a cover formula (`range = height + viewport`) also used by the visual sweep.

**Next** — PHASE 6.

---

## PHASE 6 — Core editorial sections ✅

**What changed** — thirteen new components: `Load`, `Teach`, `Day` +
`DayFragment`, `Memory`, `Automate`, `Product`, `Client`, `Boundary`, `Night`,
`Voice`, `Ledger`, `Handover`, `WorkTape`, assembled by `layouts/Landing.astro`.
Removed: `Before`, `DayScene`, `FinalCta`, `Honesty`, `MathSection`, `Pillars`,
`Touch`, `VoiceSection`, `Words` and `lib/{day,sphere,touch,voice,words}.ts`.

**Why** — §2 and the OLD→NEW table in the plan: every deletion has a named
replacement carrying the same purpose, none was removed for taste.

**Tests run** — build (3 pages), 3 locales × 6 viewports console + overflow.

**Result** — the 3 duplicated page files are now four lines each.

**Next** — PHASE 7.

---

## PHASE 7 — Session-aware interactions ✅

**What changed** — `src/session/{state,storage}.ts`, `src/motion/teach.ts`,
wiring in `Teach` → `Client` → `Handover`.

**Why** — §24: the site's central claim is that it remembers. The store is a
pure module with an injectable clock and storage adapter, so every transition is
unit-testable and every reset deterministic.

**Decisions** — `remember()` is idempotent per id, so scrolling back cannot
inflate the counts. Persistence is best-effort: a quota or private-mode failure
degrades to memory-only and must never surface as a broken button.

**Tests run** — `tests/unit/session.test.ts`, journey E2E.

**Next** — PHASE 8.

---

## PHASE 8 — Live product integration ✅

**What changed** — `src/motion/product.ts`, `src/motion/tabs.ts`,
`ui/AppWindow.astro` + the six panes.

**Why** — §22: the paper opens (EXPAND, `clip-path`) onto the *real* product,
not a screenshot. All six panes stay interactive.

**Known issue fixed** — the automation primitives rested at 28 % opacity, which
is a genuine readability failure, not a style. Mechanism changed to grey→ink so
they are legible at every point of the scrub.

**Tests run** — E2E: all six panes reachable, kanban drag + keyboard.

**Next** — PHASE 9–10.

---

## PHASE 9–10 — Cursor, microinteractions, mobile ✅

**What changed** — `src/motion/cursor.ts`, `src/motion/tape.ts`, mobile
staging across `base.css` and the section components;
`scripts/overflow-probe.mjs`.

**Why** — §27: mobile is a separate staging, not a scaled desktop. §14: the
contextual cursor is desktop-only and never load-bearing for information.

**Tests run** — overflow probe at 320/360/375/390/393/412/430 + tablets, all
three locales; reduced-motion and no-JS passes.

**Result** — no page-level horizontal overflow at any viewport or locale
(baseline had 325 vs 320 px on RU). Cursor is fine-pointer only.

**Next** — PHASE 11.

---

## PHASE 11 — Accessibility ✅

**What changed** — `src/motion/tabs.ts` (real tab semantics: `aria-controls`,
`role="tabpanel"`, roving tabindex), skip link, keyboard path for the kanban,
text alternative + summary for the memory graph, `lang` on the switcher,
minimum type sizes inside `.ui`.

**Why** — §32–33 and the seven a11y defects logged in the baseline.

**Known issues fixed** — a tabpanel was orphaning its list items; a footer
target was under the minimum size; transitions were being measured mid-flight.

**Tests run** — `axe-core` across all locales and all six panes;
`tests/e2e/a11y.spec.ts`.

**Result** — zero WCAG A/AA violations.

**Next** — PHASE 13 (tests were brought forward ahead of PHASE 12, so the
performance work had a green suite to regress against).

---

## PHASE 13 — Test architecture ✅

**What changed** — `vitest.config.ts`, `playwright.config.ts`,
`tests/unit/{i18n,motion,session}.test.ts`,
`tests/e2e/{journey,a11y,robustness,visual}.spec.ts` + 51 baselines.

**Why** — §34–38. E2E runs against the **production build** served by
`astro preview`, not the dev server: the budget claims and the Pages base path
only mean something on built output.

**Known issues found by the tests (all fixed in `src/`, not in the tests)**
1. A throwing storage adapter propagated into the UI → the store now degrades to
   memory-only.
2. `reuseExistingServer` was serving a stale build, so the suite briefly passed
   against code that no longer existed → now always rebuilds.
3. The automation sentence dropped its connective words when reassembled → the
   tokens now reconstruct the source sentence exactly, locked by a test.

**Result** — 79 unit tests; E2E green on Chromium, Firefox, WebKit and two
mobile devices. The one WebKit "failure" was Safari's default of not tabbing to
links — a browser preference, so the test asserts the behaviour that matters.

**Next** — PHASE 12.

---

## PHASE 12 — Performance ✅

**What changed** — `scripts/lighthouse.mjs`, `scripts/serve-gzip.mjs`;
`src/assets/mark.png` replaces the 40 KB PNG logo at its 22 px render size.

**Why** — §31. Local `astro preview` does not gzip and GitHub Pages does, so
measuring against the preview server would have reported a number the visitor
never experiences.

**Decisions** — an inline-stylesheet split was implemented, measured, and
**reverted**: LCP was unchanged and it introduced a small layout shift.
Complexity that does not pay is not kept.

**Tests run** — Lighthouse mobile, all three locales, against the gzip server.

**Result**

| Locale | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| RU | 94 | 100 | 100 | 100 | 2.2 s | 2.6 s | 0 ms | 0 |
| EN | 97 | 100 | 100 | 100 | 1.9 s | 2.3 s | 0 ms | 0 |
| UZ | 96 | 100 | 100 | 100 | 2.1 s | 2.3 s | 0 ms | 0 |

**Deviation, documented not hidden** — RU LCP is 2.6 s against a 2.5 s target.
RU is the longest headline and the one locale that needs the Cyrillic subset of
the variable font. EN and UZ are inside budget. Everything else clears.

**Next** — PHASE 14–15.

---

## PHASE 14–15 — Cross-browser QA, CI, polish ✅

**What changed** — `.github/workflows/deploy.yml` (types + unit + E2E on three
engines gate the deploy), `README.md`, `.gitignore` (QA artefacts),
plus the defects below.

**Known issues found and fixed**
1. `?session=reset` stayed in the URL and re-fired on every reload and every
   Back, quietly wiping a session the visitor was in the middle of. Now a
   one-shot action consumed via `history.replaceState`.
2. A hover state changed the element's own padding, shifting the box under the
   pointer. Moved to a transform.
3. The teach panel could be clicked before its script bound. It now declares
   `data-teach-ready`, so the test waits for the exact thing it uses instead of
   sleeping.
4. **The teach panel arrived on a transform.** A control that is still sliding
   into place when the pointer arrives moves out from under the click — a real
   UX defect, not a test artifact. Interactive controls no longer sit inside a
   moving reveal (`Teach`, `Memory`, `Ledger`), and `a11y.spec.ts` now enforces
   the rule so it cannot regress.
5. **The handover visual baseline disagreed with itself between runs.** Root
   cause: the report shows a row per *kind* of event and hides the rest, so its
   height moves in whole rows (~57 px); which kinds occurred depended on which
   sections that particular scroll crossed. Masking the report hid its pixels
   but not its height. The sweep now fills all five rows before the shot, so
   later observers can add ids but no longer add a *row*. Verified by two
   consecutive clean runs, not by one.

**Tests run** — `npm run check`; `vitest run`; the full Playwright suite across
`chromium`, `firefox`, `webkit`, `mobile`, `mobile-small` and `visual`.

**Result** — see the closing gate below.

---

## CLOSING GATE ✅

Run on the production build, after the last fix.

| Gate | Result |
|---|---|
| `astro check` (52 files) | 0 errors, 0 warnings, 3 hints |
| `vitest run` | **79 passed** (3 files) |
| `playwright test` — chromium · firefox · webkit · mobile · mobile-small · visual | **246 passed**, 0 failed, 0 flaky (5.0 min) |
| Visual regression | 51 baselines; two consecutive clean runs |
| Lighthouse mobile (gzip server) | RU 94 · EN 97 · UZ 96 — a11y/BP/SEO 100 everywhere |
| axe-core WCAG 2.1 A/AA | 0 violations, all locales, all six product panes |

---

## FINAL AUDIT (§57)

Answered against evidence, not intention.

**A. Remove the animation — is the design still strong?** *Yes.* All 51 visual
baselines are captured with motion frozen, and they hold on their own: the
editorial grid, hairline rules, tabular mono column and type hierarchy do the
work. Motion is the grammar, not the substance.

**B. Remove the text — does it read as a business operating system?** *Mostly.*
The timestamp column, state labels, rules and tabular figures read as an
operations journal rather than a landing page. Honest limit: stripped of text
completely, the paper world alone could pass for editorial design — what carries
the reading is the persistent work tape and the timestamped feed beside it.

**C. Swap ECHELON for another AI SaaS — does it still make sense?** *No, and
deliberately so.* The rule you teach in section 3 is applied in section 8 with
its own footnote; the gate stops against your decision; the last screen reports
what *you* did. None of that transfers to a generic product. Weakest point: the
economics section (`Ledger`) argues a case that most tools could argue.

**D. Three moments worth showing someone?** *Yes — and each is covered by a
test, so they are mechanisms, not claims:* the taught rule resurfacing six
sections later (`the rule taught early is used much later, and footnoted`); the
paper splitting open onto a genuinely operable product (`the real product demo
works: every pane, the graph, the chat, the board`); the session-aware shift
report (`reports what the visitor actually did`).

**E. Can the page be read calmly?** *Yes.* Body measure is enforced by a test
(≤ 80 characters), target sizes by another, palette contrast by
`scripts/contrast.mjs`.

**F. Is it pleasant on a phone?** *Yes.* Mobile is authored, not scaled: the
feed moves below the CTA, the tape becomes a rail, the product goes
edge-to-edge. Two mobile projects run in the suite and no page-level horizontal
overflow exists at 320–430 px in any locale.

**G. Does the product feel more trustworthy afterwards?** *Yes.* The boundary
section states limits instead of hiding them, and the handover omits rows for
things that did not happen rather than showing them as zeroes — an honest
report, not a scoreboard.

**H. Is 60 fps held on a normal device?** *Not directly measured — stated rather
than claimed.* The supporting evidence is strong (TBT 0 ms and CLS 0 on all
three locales, GSAP removed entirely, the per-frame allocation+sort in the old
`sphere.ts` gone), but sustained frame rate *during a scrub* was never
instrumented. This is the one open item in the audit.

---

## PHASE 16 — The present tense 🚧

Opened after review of the shipped result. Three criticisms, all of them fair, and
all of them traceable to decisions recorded above rather than to defects:

1. **The site does not reflect what the product is.** PHASE 1 chose "operations
   journal" as the art direction, and a journal is a record of work *already
   done*. ECHELON's whole claim is that something is running right now, on your
   machine, while you are not looking. Fifteen thousand pixels of unchanging beige
   said the opposite. The metaphor was in the wrong tense.
2. **It reads as unreadable.** Not at letter level — `scripts/contrast.mjs` passed
   throughout. Thirteen sections opened with the same three moves (mono kicker →
   large headline → grey lead), so the eye had no way to tell the fourth screen
   from the ninth. Compounded by 12–13 px letterspaced mono in `#636057`, which
   clears AA at 5.56:1 and still reads as weak at that size.
3. **The interactive pieces were removed.** PHASE 6 deleted the voice sphere as
   "the exact glowing AI orb the art direction rules out". Right about the orb,
   wrong about the section: it left the page's strongest claim — where the product
   stops being compared to Jarvis and simply talks — as a text link and three
   empty rules.

**What changed**

- `src/motion/shift.ts` — one clock for the page. Sections declare the time they
  depict with `data-shift="HH:MM"`; the clock interpolates between those anchors
  by real pixel position. The ambient light, the load on the attention field and
  the masthead clock all subscribe to it, so they cannot disagree, and it stays a
  pure function of scroll offset, which visual regression requires.
- `src/motion/field.ts` + `src/components/Field.astro` — the attention field.
- `src/motion/light.ts` — the ground travels 09:00 → 23:00 → next morning.
- `src/motion/core.ts` — the voice core, driven by a real FFT.
- `src/components/Seam.astro` — three chapter breaks where the paper stops.
- Section marks in `base.css`: each section's own timestamp over a full-width
  hairline, drawn from `attr(data-shift)`, so it costs no markup and differs
  everywhere.

**Decisions**

*The field is a switchboard, not a constellation.* The first build was a node mesh
with nearest-neighbour edges and came out as the floating-dots-and-lines wallpaper
every AI landing page ships: decorative, organic, and saying nothing about this
product. What ECHELON does is *route*. So: stations on a lattice, orthogonal runs,
events travelling them with trails. Right angles and hairlines are the language
the rest of the page is already set in.

*Nothing is drawn over text, and this is enforced rather than intended.* The
module builds an occupancy grid of every text box in the document and reads it per
point, so the guard follows the real layout in all three locales at every
viewport. `data-field-surface` raises intensity only — it can never open the
guard. A moving background behind body copy is the defect this phase exists to
fix and it must not return as atmosphere.

*The dark bands took three attempts.* An 82 % veil over the shared canvas washed
black to brown, because what showed through was the light body ground. Dropping
the veil to zero looked right and failed axe outright — the computed style said
light text on light paper, and it was correct to, because any canvas failure would
have left the band genuinely unreadable. Final form: the band keeps a real opaque
background and carries its own `[data-band-field]` canvas between that background
and its type. It also reads better, because the switchboard now scrolls with the
section instead of sliding behind a window.

*The ambient ramp is gated, not eyeballed.* `scripts/contrast.mjs` now checks every
stop the light can reach, *composited* at the paper veil against the darkest ground
behind it. The first ramp was considerably deeper toward evening and the gate
rejected it: `ruleStrong`, `signal` and `inkSoft` all fell under AA. Night arrives
as warmth; the actual dark is carried by the vignette and the bands, which have no
text over them.

*The core is audio-truthful and says nothing it cannot support.* Its deformation
is a real FFT of whatever is playing. The named entities on it are a fixed property
of their points and are never timed to the audio — nothing here knows which word
is being spoken, and implying otherwise would be the one dishonest thing on a page
whose argument is that it does not overclaim. The live session reports amplitude
only, so there the core breathes as a whole rather than resolving bands.

**Known issues found and fixed**

1. `?motion=off` added. Playwright's `animations: 'disabled'` stops CSS animation
   and has no effect on a canvas rAF loop, so both canvases would have made every
   visual baseline flaky.
2. **The occupancy grid was built synchronously at start-up.** It walks every text
   box in a sixteen-thousand-pixel document — one large layout flush. On a 360 px
   phone it blocked long enough that the intro's timers all fired at once when it
   released, and the entry sequence was simply gone; six mobile tests timed out on
   it. Now built on idle, and until it exists the guard reports *occupied*, so the
   switchboard draws nothing rather than risking a line across a paragraph.
3. Rebuilding the grid on every `resize` event meant dozens of full-document
   layout reads per second while dragging a window edge. Debounced; the canvas
   still follows the viewport immediately.
4. The band canvas matched `canvas` in the occupancy selector, marking its entire
   section as text and suppressing the switchboard exactly where it matters most.

---

## OPEN ITEMS

1. Sustained scrub frame rate is not instrumented (§57-H above).
2. RU LCP is 2.6 s against the 2.5 s target; EN and UZ are inside budget.
3. `npm audit` still reports the sharp/astro advisories from the baseline.
   `astro:assets` is not used, so neither is on a runtime path.
