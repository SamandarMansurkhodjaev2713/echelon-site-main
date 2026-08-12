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
5. **The page depicted two days, not one shift.** Every scene of the day montage
   declared its own `data-shift`, running `09:00` → `19:00`, so the `13:00` section
   after it could only be read as the *next* day: at 30 % scroll the clock said
   `04:39` and the ambient light ran a full night in the middle of the working day.
   Every section was correct in isolation, which is why nothing short of sampling
   the clock down the whole page finds it. The montage's times are now content, not
   page time — the clock is anchored by the seams around it and by the sections
   that follow, so it runs `09:00` → `13:00` across the montage instead of
   rewinding after it. Locked by a robustness test that walks 24 scroll positions
   and asserts two separate things: that the clock never goes backwards, and that
   the page spans less than a day end to end. The second assertion is the one that
   catches this class of fault — a rollover keeps the sequence perfectly monotonic
   while quietly pushing the end of the page into day three.
6. The intro's skip control appeared and vanished inside 380 ms in short mode,
   which is a flash rather than an affordance. It is offered only for the full
   intro; Escape and a scroll still skip either way.
7. `playwright.config.ts` takes `E2E_PORT`, because a development machine usually
   already has a dev server on 4321. The default is unchanged, so CI and the README
   are unaffected.
8. **The visual suite would have masked the entire page.** It masks every `canvas`,
   which was right when the only canvases were the graph and the core. The
   attention field's canvas is `position: fixed; inset: 0`, so from this phase
   onward that mask covered the whole frame and every baseline would have been one
   pink rectangle. The field is now exempt, and earns it: under `?motion=off` it
   renders a single seeded frame and advances no state, so it is a pure function of
   viewport and scroll offset. The exemption came with an obligation — the shot has
   to wait for `data-field-ready`, because the frozen frame is drawn only after the
   occupancy guard is built, which is deliberately deferred past the intro and onto
   idle. Without that wait the baseline would record whether the machine happened
   to be quick that run.
9. **Every visual baseline was stale, and thirty-nine of them still passed.** The
   tolerance was `maxDiffPixelRatio: 0.02`, which at 1440 × 900 lets about 26 000
   pixels move. A full-width hairline is ~1 130 px and a timestamp label ~500, so
   this phase could add a rule and a time to *every* section, plus three chapter
   breaks, a grain layer, a vignette and a full-viewport canvas, and only twelve of
   the fifty-one baselines noticed. Regenerating with `--update-snapshots=all`
   rewrote **51 of 51** — proof that every one of them depicted a page that no
   longer existed, including the thirty-nine the gate had been calling green. The
   tolerance is now derived instead of guessed: re-running against fresh baselines
   is bit-identical (51/51 at ratio 0 *and* per-pixel threshold 0), so the noise
   floor is zero, and 0.0005 sits below the 0.0008 of a frame that a bare hairline
   occupies at every viewport in the matrix. The reasoning is written into
   `playwright.config.ts` beside the number, because a threshold whose derivation
   is lost is a threshold the next person will loosen.

**The anchor sequence, checked by hand as well as by test**

`08:50` hero → `08:56` load → `08:58` teach → `09:00` seam → *montage, no anchor* →
`13:00` product → `15:00` memory → `17:00` automate → `18:20` client → `19:40`
boundary → `23:00` seam → `23:20` night → `23:40` voice → `00:40` ledger *(+1 day)*
→ `07:00` seam → `07:10` handover. Monotonic, exactly one rollover, 22 h 20 min end
to end. `main > section[data-shift]` guards the section mark, so the montage —
the one band that deliberately declares no time — draws no empty hairline.

---

## RUNNING THE SUITE LOCALLY

The full five-project matrix must not be run on this workstation. This is a local
constraint, not a property of the suite: CI runs the same matrix without trouble.

Three attempts on 11 Aug ended in a Windows bugcheck `0x0000010E`
(`VIDEO_MEMORY_MANAGEMENT_INTERNAL`) — at 11:49, 13:03 and 13:50, the last of them
nineteen seconds after Playwright had finished writing its own summary. Firefox
logged `RenderCompositorSWGL failed mapping default framebuffer` inside the same
runs, so the userspace symptom and the kernel fault agree with each other.

This matters for reading a red report. The run that "found" 137 failures out of 200
was reporting a machine that had stopped, not a page that was broken: every one of
those failures was a timeout — several inside `browserContext.close`, which no page
can cause — and every one passes when its project is run by itself.

The trigger is established; the root cause is not. The bugcheck is specific to
*video* memory, the GPU is an RTX 3050 Laptop with 4 GB of VRAM on a driver dated
October 2024, and the page now composites two canvases in every engine at once. Run
one project at a time at two workers, and the visual project at one.

---

## FRAME RATE — §57-H, MEASURED AT LAST

The audit's one open item was that sustained frame rate during a scrub had never
been instrumented: the supporting evidence was strong (TBT 0 ms, CLS 0, GSAP gone)
but the thing itself was stated rather than shown. This phase added two canvases,
so it stopped being optional. `scripts/fps.mjs` drives the page with real wheel
events at a human rate and samples `requestAnimationFrame` deltas inside the page.

Measured against the production build behind the gzip server, 18 s of continuous
scrolling covering the whole page. The right-hand column is a control: the same
page under `?motion=off`, both canvases frozen, so the difference between the
columns is what the machine layer costs.

| | canvases live | canvases frozen |
|---|---|---|
| 1× — median | 16.7 ms | 16.7 ms |
| 1× — p95 | 33.3 ms | **16.8 ms** |
| 1× — worst | 83.4 ms | 33.4 ms |
| 1× — frames > 33 ms | 6.3 % | **0.7 %** |
| 4× — p95 | 83.2 ms | 83.4 ms |
| 4× — frames > 33 ms | 39.0 % | 29.7 % |

**The honest answer to "is 60 fps held" is: at the median yes, at the 95th
percentile no.** At full speed the page drops a frame in 6.3 % of them, and
freezing the two canvases takes that to 0.7 % — so at full speed the attention
field and the voice core account for essentially all of it. Under 4× CPU
throttling the picture inverts: 29.7 % of frames are dropped with the canvases
frozen and 39.0 % with them live, so on a slow machine they are a minor
contributor and the page's own layout and paint dominate.

Reading the table: the script's `> 16.7 ms` counter is deliberately not quoted
here. That threshold sits exactly on the refresh interval, so ordinary jitter puts
roughly half the frames "over" it on a page that is in fact running at 60 fps.
`> 33 ms` is the count that means a frame was genuinely dropped.

One thing found by reading rather than by measuring, and left open rather than
fixed on a guess: `field.ts` opens with a budget rule saying nothing is
"allocated, sorted, stringified or style-read inside the loop", and then builds a
fresh `rgba(…)` string for `ctx.strokeStyle` once per draw — on the order of 380
colour strings constructed and re-parsed per frame. Setting an opaque
`strokeStyle` once and varying `ctx.globalAlpha` instead is pixel-identical under
the canvas compositing rules and would remove all of them. It is not done here,
because the 6.3 % has not been attributed to that line specifically, and this
project has already once implemented, measured and reverted an optimisation that
did not pay (PHASE 12, the inline-stylesheet split). The visual gate is now strict
enough to prove such a change pixel-identical in about a minute, which is the
right way to attempt it.

### Load performance, re-measured

PHASE 12's table describes a page without the substrate, so it has the same
problem the visual baselines had. Re-run against the same gzip server, mobile
throttling, all three locales.

| Locale | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| RU | 93 *(was 94)* | 100 | 100 | 100 | 2.4 s | 2.6 s | **110 ms** *(was 0)* | 0 |
| EN | 96 *(was 97)* | 100 | 100 | 100 | 2.0 s | 2.3 s | 0 ms | 0 |
| UZ | 96 *(was 96)* | 100 | 100 | 100 | 2.1 s | 2.3 s | **20 ms** *(was 0)* | 0 |

Recorded rather than smoothed over: the substrate costs a point of performance on
RU and EN, and TBT is no longer zero — 110 ms on RU, still inside Google's 200 ms
"good" band, but not the 0 ms the previous table reports. LCP, CLS and the three
non-performance scores are unchanged. Lighthouse now also raises a *forced reflow*
insight on all three locales where it raised none before; the likely source is the
occupancy grid's walk over every text box, and that is the first place to look if
this is ever worth reducing.

---

## PHASE 17 — What the gates could not see ✅

Opened by resuming an interrupted session. The work divides cleanly: one inherited
finding that turned out not to be a defect, two defects no gate could have caught
because no gate was looking at them, and the optimisation the last phase described
and deliberately left unapplied.

**The inherited finding was a frame, not a layout.** The previous session ended
with one unexplained observation — text in `day` and `voice` starting 2 px left of
the content edge at 390 px — and declined to guess at a cause. It is RECEIVE,
caught in flight. The same elements were measured twice at the same viewport: once
immediately after the scroll that triggers the reveals, and once after every
transform in the section had actually reached `none`. Present in the first pass,
absent in the second. The confirming detail is that the two probes disagree on the
number — the earlier one recorded −2 px, this one −0.51 px. A layout offset
reproduces; a frame does not.

The comment in `base.css` that licensed the travel — *a clipped element cannot poke
anywhere* — is exact at rest and only approximate in flight, because the clip and
the transform run on different clocks. It now says so, together with the 1.6 px
this actually costs on a phone and the reason it is left alone: deriving the travel
from the gutter would close a gap nobody can see by cutting the mobile gesture a
quarter, and these patterns were enlarged on purpose after reading as a twitch.

**Two more false positives, both raised by this phase and both killed by
measuring.** `ГОТОВО` on the boundary rows looked clipped at the window edge in a
filmstrip; measured, the label's right edge sits exactly on the column edge, and
the apparent offset was RECEIVE again. And the dark rounded object covering the
bottom of every mobile frame was `ASTRO-DEV-TOOLBAR` — the filmstrip had been shot
against the dev server. **Visual review now runs against `astro preview`**, the way
the E2E suite already did. The toolbar covers the bottom ~45 px of every frame,
which is precisely where an unnoticed defect would sit.

**Canvas type was outside every gate.** The entity names on the voice core are the
only type on the page that neither `scripts/contrast.mjs` nor axe-core can reach:
they are painted into a canvas at a computed alpha, not declared as a colour. They
were carried by the same `fade` as the dots and the rings, which rests at 0.45
whenever nothing is playing — and nothing is playing until the visitor presses
play. Composited against every ground the ambient ramp can reach, that drew the
name at **2.7:1** and the kind beneath it at **1.7:1**, against AA's 4.5. The kind
label cleared AA in *no* state, not even mid-sentence at full brightness.

The type no longer shares the ornament's alpha. `depth` — how far the point faces
the reader — is all it answers to; `fade` keeps the resting dimness and now carries
only the leader line and the anchor dot. The two floors are computed, not chosen,
and `scripts/contrast.mjs` gates them the way it gates the ramp: name **6.2–6.7:1**,
kind **4.8–5.3:1** at every stop. Dropping the `open` term is a gain rather than a
compromise — the module insists these labels are never timed to the audio, and
brightening them when the voice starts was the one place that claim leaked.

**The visual gate was not looking at three sections, and that is not a
coincidence.** `SCENES` covered ten sections; `load`, `voice` and `ledger` had no
baseline at any viewport. The worst defect found in this page so far — the ECHELON
column of the comparison table sitting off the right edge of a phone, so the
section read as proving the opposite of what it claims — was in `ledger`, and the
gate was green throughout because nothing was pointed at it. It was found by a
person scrolling a narrow screen, which is not a repeatable process and does not
run in CI. `voice` was the larger blind spot: the section with the most machinery
on the page had no pixel protecting any of it.

All three are now scenes — 15 new baselines, two consecutive clean runs. `voice`
is parked at 0.78 rather than over the core, because the core canvas is masked with
the others and a frame taken there is mostly a magenta rectangle; at 0.78 the shot
holds the transcript grid, the marked citations and the italic that separates the
owner's line from the machine's. The core's own type is gated by `npm run contrast`
instead, which is a stronger guarantee for a colour than one frozen frame and does
not depend on the FFT driver being deterministic at rest.

**A reduced-motion defect, found by reading rather than by looking.** The core
repaints once when the fonts land, "so the labels are not measured too early" — and
that repaint sat only on the animated path. The frozen path draws exactly one frame
and has no next frame to correct itself on, so it kept whatever fallback face was
active at start-up. Reduced motion is a reader's preference, not only a test mode.
The repaint is now on both paths.

### The field's draw loop, measured rather than argued

The FRAME RATE section above describes this fix and deliberately does not apply it,
because the 6.3 % had not been attributed to that line and this project has already
implemented, measured and reverted an optimisation that did not pay. Both
obligations are now discharged.

*Pixel-identical, proven not asserted.* The field canvas is `position: fixed;
inset: 0` and exempt from masking, so it is present in **every** baseline. All 51
pre-existing baselines matched bit-for-bit after the change. A change to this loop
that altered a single pixel would have failed most of them.

*One difference is not cosmetic.* `rgba()` clamps an out-of-range alpha to 1; the
`globalAlpha` setter **ignores** a value outside 0..1 and silently keeps the
previous one. A station at full hit asks for 1.4. That one site clamps explicitly,
and the owner's ring still takes its alpha from the unclamped value, because that
is what the old string computed.

*It pays.* Production build, 18 s of continuous scrolling at a human rate, the same
`scripts/fps.mjs` as before.

| | live, before | **live, after** | frozen control, now |
|---|---|---|---|
| median | 16.7 ms | **16.7 ms** | 16.7 ms |
| p95 | 33.3 ms | **16.8 ms** | 16.8 ms |
| worst | 83.4 ms | **33.3 ms** | 33.4 ms |
| frames > 33 ms | 6.3 % | **0.2 %** | 0.6 % |

The live page now measures the same as the page with both canvases frozen: the
substrate has stopped costing anything the instrument can see. The 0.2 % against
the control's 0.6 % is three long frames versus eight out of ~1 400 and should be
read as indistinguishable, not as live being faster than frozen.

Two honest caveats. This was measured behind `astro preview` where the recorded
table used the gzip server; the frozen control measured now (16.8 ms p95, 0.6 %)
lands on the recorded frozen column (16.8 ms, 0.7 %), which is what makes the two
setups comparable. And pixel-identity is proven for the *frozen* frame the
baselines capture — the animated path's varying alphas rest on the compositing
argument plus the one clamp, not on 51 screenshots.

### The tape opens when it has something on it

At rest the voice tape read as an unfilled form: its top border, its centre
baseline rule and its bottom border stacked into three hairlines with nothing
between them, and PHASE 16's shortening of the box only made that a shorter empty
form. The first fix considered — dropping the canvas's silent dots — was abandoned
after looking at what those dots actually contribute: at 0.18 alpha, almost
nothing. It is the three CSS rules that produce the reading, not the canvas. This
is the fourth thing this phase nearly changed on the strength of a glance.

So the box borders are transparent until the tape has carried something, and the
baseline rule stands alone. A flat line is what silence looks like on a tape, and
`ТИШИНА` beside it already says so in words. Transparent rather than absent, so
their arrival moves nothing. The state is keyed off the measured level rather than
off the play button, which makes it mean *this tape has a recording on it* instead
of *someone pressed a control*, and it is never cleared — the trace stays after
playback stops for the same reason the history does.

### The live sphere would have been refused by its own worker

The voice worker's `ALLOWED_ORIGINS` still listed `https://komrxn.github.io` and
localhost, and the site now deploys to `samandarmansurkhodjaev2713.github.io`. The
one origin that actually needs a token was the one origin refused. Nothing about
this fails loudly: `wrangler deploy` succeeds, the README's `curl` check passes
because it sends the old origin in the header, and only a real visitor pressing
«Поговорить» meets the 403. The deployed origin is now first in the list — it is
also the CORS fallback — and the README says what that header is for instead of
carrying it as decoration.

This is the third form the wrong-repository trap has taken: the remote you push
to, the repository `gh` reports on, and now the origin a worker will answer.

### The gate went red, and it was right to be doubted

The tape commit came back failed: `[firefox] › a fast scroll to the bottom and
back leaves nothing half-drawn`, on the runner, on the first attempt and on the
retry. `test` gates `build`, so nothing deployed and the live site stayed on the
previous commit — which is what a gate is for, and worth saying plainly given the
next paragraph argues the failure was wrong.

It was wrong, and it named its own cause. Every element it listed already carried
`is-in` — `head day__scene-title is-in`, `copy day__scene-text is-in`,
`day__fragment is-in` — which is the class the observer adds when it fires. The
reveal had happened; what the test caught was the opacity transition on its way
to 1. The retry, on identical code, named a different element in a different
section. A stuck reveal is neither transient nor a different one each run. The
commit under it changed a border colour and set a flag that cannot be set without
audio, neither of which can move a reveal.

So this is the same mistake as the −2 px that opened this phase, made by the suite
rather than by a probe: a question about a state, answered by measuring a frame.
This is also the third round of tuning on this one test — the previous two
sharpened *which* elements count, and left standing the assumption that opacity
was the thing to ask about. It now asks for `is-in`, which is the stricter
question rather than the looser one: reveal.ts's own worst case is an element the
viewport crosses between two frames so that no callback is ever produced, and such
an element never receives the class and is still named. The stylesheet's half of
the bargain — that `is-in` really does resolve to a visible element — is held by
sixty-six visual baselines, every one captured with the reveals settled.

---

## PHASE 18 — The box the machine could scroll and the person could not ✅

Opened by going after two findings this log had left lying around, and both of
them turned out to be wrong. What the measuring found instead was worse than
either.

### Two claims, refuted

**The horizontal-overflow gates were suspected of being blind.** `body` carries
`overflow-x: clip`, which propagates to the viewport, and three tests assert
`documentElement.scrollWidth <= clientWidth + 1`. If the clip suppressed
scrollable width, none of them could ever fail. Tested rather than reasoned
about: a 3000 px block injected into the body at 390 px gives `scrollWidth` 3000
against `clientWidth` 390, and the assertion fires. The gates are real. Worth
recording because "your overflow test cannot fail" is exactly the kind of finding
that sounds profound and is false.

**`bound__tasks` was logged in 855d55b as clipping 12 px of its own content.** It
clips nothing. Its computed `overflow-x` is `visible`; the gate row spans
6.39–383.61 inside a 390 px viewport and its text sits on the 18.4 px gutter. The
12 px is the signal wash's deliberate bleed — `padding-inline` +12, `margin-inline`
−12 — and the report came from reading `scrollWidth − clientWidth` without asking
whether anything actually clips. Third instance of the same error, after the −2 px
and the reveal test: a question about a state, answered by measuring a frame.

### What was actually wrong

`product.ts` calls `scrollIntoView()` on every bubble it appends to the demo
chat. `.ui-content`, the box it scrolls, was `overflow: hidden`. **That box was
being scrolled by the program and could not be scrolled by the person**, and the
two do not have to agree: `overflow: hidden` permits a programmatic scroll and
denies a manual one. Measured after three chips: a 1280 laptop holding 101 px
below the fold, and a 390 phone parked at `scrollTop` 210 with 175 px still under
it, none of it reachable by hand.

At rest it was worse, and it was not confined to the chat:

| pane | 360 | 390 | 834 | 1280/1440 |
|---|---|---|---|---|
| chat | 212 px | 181 px | 37 px | — |
| vault | 314 px | 296 px | — | — |

In the chat that hid all three suggestion chips — the demo's only interactive
affordance — and the composer. **A chat window with no input box reads as a
screenshot**, which is the one thing this section cannot afford, its whole claim
being that this is the real product and not a picture of one. It is the same
fault cf16eee fixed for `.ui-side`, in the box next to it, left standing. The
vault lost thirteen rows. graph, kanban, automations and analytics were clean.

`.ui-content` is now `overflow-y: auto` with a thin scrollbar; `overflow-x` stays
clipped, because a horizontal scrollbar inside a demo window reads as the page's
own in the wrong place, and nothing there is ever wider than the box. Verified
across 48 pane × viewport × locale combinations: nothing unreachable anywhere,
and 1280/1440 unchanged.

*A scrollbar is not an affordance on a phone*, because a touch device draws none
until the scroll is already under way — and this site has been here before, with
the ledger's column reachable by a sideways drag nothing advertised. So the box
fades its bottom edge while, and only while, something is under it, keyed off the
measured remainder rather than off a scroll having happened. A permanent fade —
which is what `.ui-side` ships — would dim whatever the scroll ends on, and in
the chat that is the composer, and a dimmed composer reads as a disabled one.

### Five of the six panes are `hidden`, and a sweep walks straight past them

The first sweep of the live DOM found the chat and reported six containers. It
could not see the vault, because a pane that is not selected is `hidden`, and
`display: none` is invisible to `getComputedStyle` arithmetic. Only cycling all
six panes found the worse of the two faults. Any audit of this page that does not
drive its own controls is reporting on a sixth of the product.

### The gate

Two questions in `robustness.spec.ts`, and only the first can be waived.

1. **A box that hides its own content must say why.** `CLIPS_ON_PURPOSE` carries
   five entries, each a mechanism rather than a tolerance — the `.act` label
   swap, the tape's one-line rail, the sheet leaves on both axes, the stage's
   phone bleed, and `.ui-content` itself, which is admitted only against the
   contract in (3). Plus one general rule: a single-line `text-overflow:
   ellipsis` is a truncation that announces itself, which is what separates the
   vault's summaries — cut by up to 108 px, drawn with an ellipsis, and carrying
   the full string in `data-summary` for the card the row opens — from a column
   parked off the edge of a phone.
2. **No text may sit entirely outside a box the reader cannot scroll.** No
   allowlist; an exemption that could excuse lost text would excuse the thing
   this exists to catch. Per axis the *nearest* overflow-establishing ancestor
   decides: if it scrolls the text is reachable, and only if it clips is the text
   gone. Written the obvious way first — asking every clipping ancestor
   independently — it reported the composer as lost for being scrolled out of
   view of the window frame around its own scroller, and a gate that cries about
   working code is a gate that gets switched off.
3. **The demo window says when it has more below.** On at the top, off at the
   bottom, off on a pane that fits.

Proven able to fail, three times: reverted to `overflow: hidden`, it names the
three chips, the composer and the thirteen vault rows — 40 findings.

Building it found a sixth container none of the hand sweeps had: `.prod__stage`
clips on **y** as well as x, and only once the sheet is parted. That is the
mechanism — unclipped, the top leaf travels over the heading and reads as the
text being erased — and the only thing ever outside that box is a decorative,
aria-hidden, empty leaf.

### The fade had no pixel looking at it

All 71 baselines passed unchanged after the fix, which was the wrong kind of good
news. The product baselines are viewport-height shots parked at 0.55, and on a
phone the demo window is taller than the viewport, so its foot — the chips, the
composer, and the new fade — fell below every frame. A visible change had shipped
into a blind spot. `product-foot` parks the same section at 0.72; five new
baselines, 71 in all, and on desktop that shot covers the composer, the chips and
the lower half of the app sidebar, none of which any pixel had protected before.

### What was run, and what was not

Types clean, 80 unit tests, 71 visual baselines twice consecutively, the full
chromium and mobile projects at 42/42, and both new gates confirmed on chromium,
firefox and webkit.

The five-project matrix was **not** run to completion here, and the reason is the
one recorded above under RUNNING THE SUITE LOCALLY. As the session went on the
same tests slowed from 30 s to over a minute and a mobile-small run came back
with 18 failures; `rotating a phone keeps the page intact` timed out at 45 s in
that run and passes in **3.2 s** run alone. That is the workstation, not the
page, and pushing it further is how the previous session ended. The gate's own
cost was cut on the way past — full-document sweeps once per viewport instead of
once per pane, computed styles memoised, frames waited on instead of stopwatches
— taking it from 24 s to 10 s. CI runs the matrix on Linux and is the authority.

---

## PHASE 19 — The product's own object, and the things around it ✅

Opened by the owner with two screenshots — his software beside the site — and a
list. The list is long and this phase does not finish it; what is here is done,
tested and shipped, and what is not is named at the end.

### The sphere is the product's, and the site had thrown it away

`src/lib/sphere.ts` was a faithful vanilla port of
`hermes/web/src/features/voice/spheres/ConstellationSphere.tsx` — 460 points on a
Fibonacci sphere, links inside 0.27, water physics, phases. PHASE 6 deleted it as
"the exact glowing AI orb the art direction rules out". Sound as a general rule
about glowing orbs; wrong about this object, because it is not borrowed from
another landing page — it is a component of the thing being sold, and the owner
recognises it as one. A site arguing "this is the real product, not a picture of
it" cannot redraw the only piece of the real product it shows.

Geometry, physics and gold are unchanged. What is not is how the paint reaches
the canvas: the original builds an `rgba()` string per link and per point per
frame, about 1 800 allocations, which is the pattern PHASE 17 removed from
field.ts. Batching into one path would have fixed it and changed the picture —
under `lighter`, separate strokes accumulate where links cross, and that
accumulation is most of why the lattice reads as a mesh. So the depth term is
quantised into 24 steps, the strings for those steps are built once per frame,
and every link is still stroked individually against them.

The entity names left the canvas for the DOM. Painted as a computed alpha they
were invisible to both `scripts/contrast.mjs` and axe-core, which is why PHASE 17
had to hand-gate two alpha constants; as markup they are ordinary tokens on an
ordinary ground and the special case is gone. They reveal with ARCHIVE — the
pattern this system already had for *settling into memory* — after RECEIVE turned
out to be wrong twice over: it means an event arriving on a line, and its 0.9 s
clip wipes across a pill that small, so the names sat unreadable for nearly two
seconds. `motion/core.ts` and its spectrum plumbing are deleted.

The section is dark because it is 23:40 on this page's own clock, one section
after the night shift starts — not because dark looks technical.

### Navigation, which the page did not have

A brand, a clock, three language links and a call to action, and the only way to
reach the middle of a sixteen-thousand-pixel document was to scroll it. A
drop-down would have been the easy answer; this page is one working shift, so its
index is the shift and you navigate it by the hour.

Not one new string: every name is the section's own kicker, already proofread in
all three locales, so the index cannot drift from the section it points at. Not
one typed hour: they are read from `data-shift` at runtime, and the day montage
comes back empty and correctly so — it spans four hours, and PHASE 16 already
spent a phase unpicking a clock that disagreed with itself.

The masthead now carries `.on-ink` over a dark band. One class, because every
colour in it is a token, so brand, clock, language switch, shift scale and read
hairline invert together and cannot disagree.

### The cursor said what it would do and never what to

Four corner marks now close on the acquired element. Magnetism is the obvious
upgrade and this module has forbidden it from its first line: a control that
pulls the pointer has moved the target after the reader aimed. The frame moves
nothing. It also fixed something that had been true since PHASE 16 — the cursor
is appended to the body and drawn in `--ink`, so on the dark bands it was not
subtle, it was invisible.

### The field was drawing its wires and none of its nodes

Measured on the night band, where it is meant to be the subject: **0.244 % of the
canvas carried any ink at all, and 54 pixels out of 3.5 million were brighter than
55 % alpha.** A 420 × 300 region held two bare vertical lines. The densest cell of
an eight-by-six sweep turned out to be the stratum in the rail, not the
switchboard.

The arithmetic agrees: 58 stations at r 1.6 cover 0.05 % of the viewport while the
runs cover about twenty-five times that. A network drawn as edges with invisible
nodes is hatching. Now 78 stations at r 2.2, station alpha 0.38 → 0.6, run alpha
0.34 → 0.26, route probability 0.30 → 0.22 so the extra stations arrive as places
rather than as a denser mesh. The side bias — stations pushed to the edges because
"the middle is where the reading happens" — was a second, cruder guard on top of
an occupancy grid that already knows where every text box is to the pixel;
harmless on paper, and on a dark band it was what emptied the middle. Softened,
not removed. Events had a quiet floor of 0.5 spawns a second across the whole
board, so the one thing the layer exists to show was often not on screen; now 1.8.

And the turn is drawn: a run bends exactly once and that bend is a switch.
Undrawn, collinear runs and their corners read as one large empty rectangle, which
is most of what made the layer look architectural.

Result on the same band: ink 0.244 % → 0.334 %, bright pixels 54 → 330. Paper
sections unchanged in character — 0.24 % inked and **zero** bright pixels on
memory. Only three of seventy-one baselines moved, all of them dark bands, which
is the same statement made by the gate.

### Two defects this phase shipped and then fixed

The index button lost its accessible name on a phone: below 36rem its word was
hidden with `display: none` and the only other thing inside it is three
aria-hidden rules, so `button-name` failed as critical in all three locales on
both phone profiles — and at 20 px wide it also missed the 44 px floor. Caught by
CI, not here, because the local run was `--project=chromium`, a desktop viewport.
Both phone profiles exist for exactly this and neither was asked.

Adding a fifth element to the header also broke its fit invisibly: 4 px over its
box at 320, 2 px at 390, 18 px at 560, each of them a horizontal scrollbar on the
whole document. The two optional elements were standing down at breakpoints tuned
for four things. Re-measured across eight widths.

### Three things that looked like defects and were not

The skip link "appearing" over a headline is a fixed element printing into an
element-screenshot of a section taller than the viewport; it sits at −51 px. The
memory chips rendering "empty" is a 0.9 s clip caught mid-wipe; it reaches
`inset(0)` by 3 s. And a baseline that failed four runs out of four at exactly
2000 pixels was not flaky — the update filter had been written with the
reporter's `›` separator, matched no test, and updated nothing.

### What the field cost, honestly

Old and new measured back to back on this machine and this server: p95 33.3 ms
both, long frames 5.5 % against 5.8 %. Then the same build three times: 6.5 %,
10.8 %, 9.1 %. The spread of the measurement is four points, far wider than the
difference being asked about. So neither "it costs nothing" nor "it costs a point"
is supportable: p95 is unchanged in every run, and this workstation cannot resolve
the long-frame delta today. PHASE 17's 0.2 % does not reproduce here on the
*untouched* build either, which places it with the machine.

---

## PHASE 20 — Finishing the owner's list ✅

### The play button could not be pressed on any desktop width

Found while checking a button animation, which is the only reason it was found.
Playwright refused to hover «Послушать» and said four times that a `.voice__said`
line "intercepts pointer events". It was right: `.voice__console` was sticky above
62rem, the transcript overlapped the stuck console by **450 px** at 1440, 1280 and
992, and `elementFromPoint` at the button's centre returned a transcript line. The
section's primary control was dead on every desktop width, and worked at 834 and
390 where the sticky is off — which is why looking at phones never showed it.

The sticky only ever worked while the console was short. It now carries the
sphere, five chips, three controls and the tape. Removed; the gap between console
and transcript measures 80–112 px at all five widths.

### Is the page actually monotonous? Not the way the tally said

PHASE 19 left the question open on purpose after the count-based claim collapsed.
Answered by sampling every section 200 ms into its arrival rather than by reading
attributes:

- RECEIVE opens **six** of thirteen sections, not thirteen, and in five of them it
  is on inner repeated rows — transcript lines, day scenes, pillar rows — where an
  event arriving on a line is exactly what is happening.
- **Three sections have no arrival gesture at all**: product, automate and night
  carry zero `data-reveal`. They are scrub-driven and so have choreography, but
  nothing marks their arrival.
- **No section heading animates anywhere.** Kicker, headline and lead simply are
  where they are.

So the page's sameness is not repetition; it is that sections do not announce
themselves. That is a different job from the one the open item described, and it
is written up as such below rather than guessed at here.

### The quiet button had no gesture

`.act-quiet` was "minimal type displacement, nothing else", and nothing else meant
a colour swap on a static hairline — the only control on the page with no gesture,
on the voice band where controls matter most. Its rule is drawn now rather than
recoloured, in the same idiom as the seam's hairline and the index's rows. Two
gradients rather than a border, because a border can only be switched. `.act` was
examined and left alone: it already swaps its label vertically, moves its mark and
darkens on press.

### Mobile, audited rather than assumed

Every section at 360, 390 and 430, walked a screenful at a time so each element is
judged **while it is on screen and settled**: clean at all three. The earlier
sweep that reported five sections with content 2 px outside the left edge was
measuring elements far below the fold that had not revealed yet and were sitting
at RECEIVE's resting −20 px. That is the third time this page's "−2 px" has been
found and dismissed; the audit now filters by vertical position so it cannot be
found a fourth.

"Кривая косая" described the state before PHASE 18 fixed the demo window and
PHASE 19 fixed the header's fit. Nothing further was invented to justify the item.

### The palette's second half

The hybrid was half made. Laid against the hours the page publishes, it was
disagreeing with its own clock — 23:20 dark, 23:40 dark, **00:40 paper**, 07:10
paper. Ledger was the only night section on paper, at the deepest hour on the
page. It is dark now and the night runs unbroken to the dawn seam. Nothing needed
a new colour: `.on-ink` already inverts every token the table is built from, and
the `--rule-strong` raised to 3.42:1 in PHASE 19 is what lets its rules clear 3:1
here without anything tuned for this section.

---

## PHASE 21 — One gesture, at four scales

Three passes had converged on the same motion without anyone deciding to: the
menu prints its index a line at a time, sections are fed out from under their
rule, a seam parts from its centre. That is not a coincidence — this site is a
log that writes itself — so this phase made it the site's language rather than a
repeated accident, and used it at the one scale still missing.

**The intro is the first page of that log.** Its content was always right and its
staging was a card in a blank cream rectangle, which is what a loading screen
looks like however good the card is. The sheet now rules itself: seven hairlines
drawing down the page under the operation, unequal because a page of records is
unequal. It also fills the only genuinely dead moment on the site — the rules
animate off `data-intro`, set by the inline head script *before first paint*,
while the beats wait for the module to load, so the ~600 ms of empty card outline
is now the page preparing itself. Measured: at 700 ms the rules are drawn and the
card is still empty, which is exactly the window that needed filling.

**And the sections stopped arriving identically.** Four arrivals — FEED, SETTLE,
HALT, BREATHE — each meaning what its sections do, and each taken from the page's
own reveal vocabulary rather than invented, so the motion a reader has watched a
*row* make is the motion its *section* makes. `#boundary` halts because it is the
one section that stops rather than proceeds; `#night` and `#voice` breathe
because they are where the machine works unwatched.

### The flake that had been failing one shot per run all session

A different arbitrary baseline failed every run, about 200 px, deterministic
within a run. The diff named it: the shift scale's notch positions are computed
from the document's measured height at load and again when the fonts land, so a
run that arrives a frame earlier places fourteen ticks a pixel or two
differently. That is a value that depends on when the machine got there — the
same reason the elapsed clock is masked — and it is masked now too. 71/71 twice
consecutively, and the suite has been quiet since.

### What was asked for and deliberately not done

The cursor. It already names the semantic action, re-reads that meaning when a
control redefines itself mid-hover, frames what it has acquired and inverts on
the dark bands; a used chip carries `pointer-events: none`, so there is no state
in which it promises something that will not happen. The obvious next step is
magnetism, which this module has forbidden from its first line because a control
that pulls the pointer has moved the target after the reader aimed at it. No
addition was found that was smart rather than ornamental, so the effort went
where the page's feel actually changes. Recorded rather than quietly skipped.

---

## OPEN ITEMS

1. RU LCP is 2.6 s against the 2.5 s target; EN and UZ are inside budget.
   Unchanged by this phase.
2. TBT is no longer 0 — 110 ms on RU, 20 ms on UZ — with a forced-reflow insight
   beside it. Inside the "good" band, but a regression against the recorded number.
   Not re-measured this phase; the field fix removes per-frame work, not the
   occupancy grid's start-up walk, which is the suspected source.
3. ~~At the 95th percentile the page runs at 30 fps.~~ **Closed by PHASE 17** —
   p95 33.3 ms → 16.8 ms, long frames 6.3 % → 0.2 %, pixel-identical across 51
   baselines.
4. `npm audit` still reports the sharp/astro advisories from the baseline.
   `astro:assets` is not used, so neither is on a runtime path.
5. ~~The CI gate has never actually run.~~ **Corrected in PHASE 17: it runs, and
   the original claim was read off the wrong repository.** Bare `gh run list` in
   this working tree answers about `fork` — the older `echelon-site` — where the
   workflow's only invocation really does sit at `action_required`. On `origin`,
   `echelon-site-main`, which is the repository that deploys, the gate has run on
   every push since 11 Aug and is demonstrably real rather than decorative: it has
   passed repeatedly, failed once on `fa4f58b`, and been cancelled once by the
   `pages` concurrency group. This is the same trap as pushing to the
   obvious-looking remote, wearing different clothes. Ask it by name:
   `gh run list -R SamandarMansurkhodjaev2713/echelon-site-main`.
6. **The visual baselines cannot pass on the CI runner.** Playwright puts the
   platform in the snapshot file name, so the 71 `…-visual-win32.png` files have no
   `…-visual-linux.png` counterparts and `ubuntu-latest` would fail every one of
   them as a missing snapshot — which, since `test` gates `build` and `build` gates
   `deploy`, means nothing would ever deploy. Three ways out, and choosing between
   them is a real trade-off: run the visual project only where its baselines exist
   and lose visual cover in CI; commit a second, Linux-captured set; or run visual
   in CI inside the official Playwright image so one set serves both. **Decided,
   not closed** — and this entry went on saying "undecided" long after the decision
   was in the code. `playwright.config.ts` takes the first way out
   (`HAS_BASELINES = process.platform === 'win32'`), so on the runner the project
   does not exist rather than failing: deploys stay unblocked and CI has no visual
   cover at all. The third option is the one that would actually give CI eyes.
7. The three seams still have no baseline of their own — `SCENES` parks on section
   ids and the seams carry none. PHASE 17 closed the `load` / `voice` / `ledger`
   half of this gap; an id on each seam and five more baselines would close the
   rest.
8. The voice core's canvas is masked in the baselines, so its *drawing* is
   unprotected — only its type is, by `npm run contrast`. Exempting it the way the
   attention field is exempted would require the frozen frame to be proven a pure
   function of viewport, including what the FFT driver returns at rest. Worth
   doing; not attempted here.
9. ~~The voice tape reads as an unfilled form before anything has been played.~~
   **Closed by PHASE 17** — the box opens when the tape has carried something; at
   rest only the baseline is drawn.
10. **`journey.spec.ts:54` asserts a state that is gone by the time it looks.**
    `expect(html).toHaveAttribute('data-intro', '')` is an assertion about the
    intro *while it is running*, with no tolerance, so on a machine that gets
    ahead of the runner it fails with Playwright's unhelpful "serializes to the
    same string". Seen once in four chromium runs on 12 Aug. CI's `retries: 1`
    absorbs it, which is why it has never been seen there. Logged rather than
    patched: it is unrelated to the fault PHASE 18 was fixing, and re-timing an
    assertion that has not been characterised is the same move this log has had
    to undo three times. Characterise it first, then fix it.
11. **`.ui-side` still fades permanently.** PHASE 18 gave `.ui-content` a fade
    that is present only while there is more below, precisely because a standing
    fade dims whatever the scroll ends on. The sidebar next to it — whose
    22 px this borrowed — still carries the unconditional `mask-image` it was
    given in cf16eee, so its last item is dimmed even once you have reached it.
    Smaller stakes than the composer, and the same argument.
12. **The demo's scrolled-to-bottom state has no baseline.** `product-foot`
    covers the fade at rest; the composer-visible, fade-absent state is a
    *state*, not a scroll offset, so it is gated behaviourally instead, by
    "the demo window says when it has more below". That split is deliberate and
    consistent with how the core's colours are gated, but it is worth naming:
    no pixel checks what the bottom of that window looks like.

### Still owed from the owner's list (PHASE 19 did not reach these)

13. **The live voice.** `VOICE_WORKER_URL` has been empty for the whole history of
    the repository, so the «Поговорить» button is hidden by contract and the
    sphere runs on the recording only. This is not a bug to fix in the site: it
    needs a Cloudflare Worker deployed against the owner's own Gemini key, per
    `worker/README.md`. Everything on this side is ready and turns on with one
    string. Deferred by the owner for now, deliberately.
14. **The intro.** Asked to be "more wow"; untouched this phase.
15. ~~Thirteen of twenty-four reveals are RECEIVE, which is why the page reads as
    one gesture repeated.~~ **Half wrong, and corrected by reading them.** That
    was a count offered as evidence. Load's events genuinely arrive — it is the
    section's operation; Voice's transcript arrives a line at a time; Pillars
    carries a comment stating the metaphor outright, "the rule is ruled before it
    is written on", and RECEIVE is that metaphor. Those are right. One of the
    thirteen was wrong — the seams, which are chapter breaks and not arrivals —
    and it now has TURN, a seventh pattern and the only one that moves outward
    from a centre. **What remains open is the question the tally was standing in
    for:** whether the page *feels* repetitive when scrolled is a judgement to be
    made by watching it at length, not by counting attributes, and that has not
    been done. **Answered in PHASE 20 by watching it**: RECEIVE opens six of
    thirteen sections and sits on inner rows in five of them, which is right
    where it is. The real finding is different and is now item 19.
16. ~~Button animations.~~ **Closed by PHASE 20** — `.act-quiet` draws its rule
    instead of recolouring it; `.act` was examined and needed nothing.
17. ~~The mobile pass, section by section.~~ **Closed by PHASE 20** — every
    section audited at 360, 390 and 430 with each element judged while on screen
    and settled: clean at all three. The complaint predates the PHASE 18 and 19
    fixes, and nothing was invented to justify the item.
18. ~~The palette shift is half-made.~~ **Closed by PHASE 20** — ledger is dark,
    because laid against the hours the page publishes it was the only night
    section on paper, at 00:40. `load` and `product` stay on paper deliberately:
    they are 08:56 and 13:00, and the product's machine already appears as a dark
    object *on* paper, which is the stronger statement of that section. The gold
    the sphere brought is still used only by the sphere and one 4 px dot, and that
    is left alone rather than spread for the sake of spreading it.
19. ~~Sections do not announce themselves.~~ **Wrong, and the fourth measurement
    artefact of this session.** They do: `main > section[data-shift]::before`
    draws its hour across a full-width hairline as the section enters, driven by
    `animation-timeline: view()` with an `@supports` fallback that simply leaves
    the mark drawn where the feature is missing. Verified on the dev server and in
    production — `clip-path` resolves to `inset(0 0 0 0)`, duration `auto`,
    timeline `view()`, the mark visible over the kicker.

    The claim came from a filmstrip that sampled `[data-reveal]` elements 200 ms
    into each section's arrival. The mark has no attribute and no class — it is a
    pseudo-element on a scroll timeline — so that sweep could not see it, and its
    absence from the sample was read as its absence from the page. `product`,
    `automate` and `night` carrying no `data-reveal` is true and means only that
    their choreography is scrubbed rather than triggered; they are not silent.

    Standing lesson, now four times over: a probe that finds nothing has found
    nothing *about the probe* until the page has also been looked at.
