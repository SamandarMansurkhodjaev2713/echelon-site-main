# ECHELON — Redesign Architecture (PHASE 1)

Reference: `docs/redesign-baseline.md`. Progress log: `docs/redesign-progress.md`.

---

## 1. THE ONE IDEA

> The site is not *about* ECHELON. The site *is* an ECHELON shift.

The visitor arrives in the middle of an operating day. Events come in, get
classified, get acted on, get remembered, and one of them stops at a boundary
because a human has to decide it. At the end, the page hands the shift back —
and the summary contains what *this visitor* did while they were here.

Everything below is in service of that. Any interaction that cannot be traced
back to a real ECHELON property is cut.

---

## 2. ART DIRECTION — "THE OPERATIONS JOURNAL AND THE MACHINE"

Two worlds, deliberately different materials, meeting once:

**The journal (marketing world).** Warm ivory paper, carbon ink, machine greys.
Rules, hairlines, margins, footnotes, tabular figures. Reads like a well-set
operations ledger — Swiss editorial, not startup landing.

**The machine (product world).** The existing dark `.ui` scope with its teal.
Untouched in character. It appears from *underneath* the paper, once, as a
physical reveal (§22). The contrast between paper and machine **is** the art
direction — no gradients, no glow, no glass required to make it land.

### Colour law

| Token | Value | Means |
|---|---|---|
| `--paper` | `#F2EFE6` | the page ground |
| `--paper-deep` | `#E8E4D8` | recessed / alternate bands |
| `--ink` | `#14130F` | the record: facts, business, headlines |
| `--ink-muted` / `--ink-soft` | greys | body, secondary |
| `--machine` | `#6E6B62` | system meta: timestamps, states, log lines |
| `--signal` | `#B33A1C` | **the owner** — their attention, rules, decisions |
| `--ui-accent` | `#14B8A6` | **ECHELON's own interface**, only inside `.ui` |

The one rule that makes it a system and not a palette:

- **Ink = what happened.**
- **Signal = the owner's hand.** The rule *you* taught. The decision that waits
  for *you*. The `[E]` marker acting *on your behalf*. Nothing else is signal.
- **Teal = ECHELON's surface**, and it only exists where the real product is.
- **Grey = the machine talking about itself.**

This resolves §20 cleanly: the approval gate is not "error red", it is
*owner-coloured*, because the owner is exactly what it is waiting for.

Explicitly banned and absent: purple/blue gradients, aurora, glow, orbs,
particles, neural imagery, mesh, glassmorphism, floating rounded cards,
gradient text, 3D blobs, sparkles.

### Type — three voices

| Family | Register | Used for |
|---|---|---|
| **Golos Text Variable** | BUSINESS | display headlines, body, the record |
| **Spectral 500 / italic** | HUMAN | quoted speech, the owner's voice, honesty |
| **JetBrains Mono Variable** | SYSTEM | times, states, IDs, tape, labels |

Already installed — no new font dependency. Display target
`clamp(2.75rem, 8.2vw, 8.5rem)` with per-locale tuning (RU/UZ run ~15–20 % longer
than EN). Body measure held at 58–72 characters.

---

## 3. INTERACTION GRAMMAR (§4 / §7)

Six named, reusable motion patterns. Every animation on the site is one of them.
Anything that isn't gets cut.

| Pattern | Reads as | Mechanics |
|---|---|---|
| **RECEIVE** | an event arriving into the record | slides in along the baseline from the margin, timestamp lands first, then content; never fades from nothing |
| **RESOLVE** | several inputs becoming one decision | multiple elements converge to a single line/row, then the sources dim to grey |
| **ARCHIVE** | information moving into memory | element shrinks to a footnote / tape row and stays reachable at the page edge |
| **ESCALATE** | motion stopping at a human boundary | the sequence physically decelerates and halts against a signal-coloured rule |
| **EXPAND** | marketing opening onto the real product | `clip-path` inset opens, paper splits, the dark machine is underneath |
| **HANDOVER** | scattered events collecting into a summary | rows fly to their slot in a final report, counters count to their real value |

Duration/easing tokens (§29): `fast 140` `normal 260` `expressive 520` `scene 900`;
easings `standard` `enter` `exit` `snap` `editorial`. Five and five, no more.

---

## 4. SIGNATURE MOMENTS (§57-D: things worth showing someone)

1. **Intro (1.9–2.6 s)** — a real operation arrives, is classified, and its own
   fragments reassemble into the hero. The wordmark is *composed out of* the
   operation, not revealed over it. Repeat visits: 380 ms transition
   (`echelon_intro_v1`).
2. **You teach it a rule, early.** Three choices, one click. Stamped
   `RULE / 014 · SAVED`. Then the page moves on and says nothing about it.
3. **The page uses your rule, much later**, inside the live client scene, with a
   quiet margin note `¹ RULE / 014 — LEARNED EARLIER`. This is the wow.
4. **Automation from a sentence** — the typed instruction disassembles into
   operational primitives as you scroll; typography-driven, no cards.
5. **The paper opens onto the real product** — EXPAND, and the thing underneath
   is genuinely interactive.
6. **The approval gate** — three tasks complete, the fourth stops dead against
   the owner rule.
7. **The handover** — a session-aware shift report of what *you* did here.

`[E]` autonomous marker (§12) is used **twice only**: once in the day scene
(silent follow-up to Тимур) and once in the night scene. Never elsewhere.

---

## 5. PAGE STRUCTURE

| # | Section | State | Carries |
|---|---|---|---|
| — | Intro | — | operation → brand → hero |
| 1 | Hero | OBSERVE | headline + live operational feed |
| 2 | Load | RECEIVE | five chats, all waiting on the owner |
| 3 | Teach | LEARN | **session rule capture** |
| 4 | Day | ACT | 09:00→23:00 temporal scene, `[E]` #1 |
| 5 | Memory | REMEMBER | entities, footnotes, the Алишер recall |
| 6 | Automation | AUTOMATE | sentence → ORDER / 018 |
| 7 | Product | UNDERSTAND | EXPAND onto the real ECHELON |
| 8 | Client | *payoff* | **the rule you taught, applied** |
| 9 | Boundary | ESCALATE | approval gate + honesty limits |
| 10 | Night | — | parallel execution, `[E]` #2 |
| 11 | Voice | — | waveform + transcript + memory highlight |
| 12 | Ledger | — | economics vs a salaried human |
| 13 | Handover | HANDOVER | session summary + CTA |

The **Work Tape** (§10) is one persistent object that changes role per section:
hero ticker → day timeline → memory history → automation schedule → night tracks
→ ledger → handover log. It is generated from one ordered event list in
`src/data/tape.ts`, never a decorative marquee.

---

## 6. CODE ARCHITECTURE

```
src/
  motion/
    tokens.ts      durations + easings, single source (mirrored into CSS vars)
    media.ts       reduced-motion / pointer / breakpoint matchMedia singletons
    lifecycle.ts   registry: register(cleanup) → destroyAll(); resize-safe
    scroll.ts      lazy GSAP+ScrollTrigger loader, matchMedia-scoped scenes
    reveal.ts      the six patterns, IO-driven, zero-GSAP
    cursor.ts      smart contextual cursor (fine-pointer only)
    intro.ts       signature entry
  session/
    state.ts       narrative state + subscribe(); pure, unit-testable
    storage.ts     versioned storage wrapper + deterministic reset
  i18n/
    index.ts       Locale, getDict, localePath(), Dict re-export
    ru.ts en.ts uz.ts
  data/
    tape.ts        the canonical event list
  components/      one per section + ui/ (product, unchanged in character)
  layouts/
    Base.astro     head/SEO
    Landing.astro  the single section list — the 3 pages become 4 lines each
```

**GSAP policy.** GSAP + ScrollTrigger stay, but load **lazily and only for the
three genuinely scrubbed scenes** (Day, Automation, Night), on fine-pointer
desktop without reduced motion. Everything else is IntersectionObserver + CSS
transitions driven by the motion tokens — zero JS weight. This removes GSAP from
the critical path entirely (baseline: 46 KB gzip on every desktop load).

Every GSAP scene is created inside `gsap.matchMedia()` with `gsap.context()` and
registered for cleanup — directly fixing baseline defect #1.

**Lenis: rejected.** §44 answers: (1) smooth-scroll feel; (2) yes — native scroll
with tuned `scrub` gives the same read; (3) ~10 KB + a rAF loop; (4) it owns the
scroll position, so every anchor/keyboard/touch bug becomes ours; (5) needs
client-only guards in static build; (6) fine on Pages but adds a request;
(7) it degrades keyboard paging and `scroll-behavior`. §8 requires the user to
always feel in control. **Not installed.**

**New dependencies:** `@playwright/test` and `vitest`, **devDependencies only**,
zero bundle cost, required by §34–38. Nothing else.

---

## 7. MOBILE IS A SEPARATE STAGING (§27)

Not a scaled desktop. Authored per scene:

- No custom cursor, no hover-dependent information, no pinned scrubbing.
- `100dvh` with `100vh` fallback; **no** `height: 100vh` layout (baseline had it).
- Work Tape becomes a compact activity rail, not a sidebar.
- Day scene: vertical chronology with a compact sticky time chip (≤10 % viewport).
- Memory: bottom-sheet reference instead of hover margin notes.
- Night: stacked tracks.
- Product: edge-to-edge, fully interactive.
- Handover: the strongest vertical moment on the whole site.
- Verified at 320 / 360 / 375 / 390 / 393 / 412 / 430 + tablets, both orientations.

---

## 8. ACCESSIBILITY & PERFORMANCE CONTRACTS

Fixed in this redesign (all from baseline §7/§9):
skip link · real tab semantics (`aria-controls`, `role="tabpanel"`, roving
tabindex) · keyboard path for the kanban · text alternative + summary for the
memory graph · minimum 11 px inside `.ui` and 12 px everywhere else ·
`<caption>`/`scope` on tables + focusable labelled scroll regions ·
focus management on injected cards · `lang` on the language switcher ·
untranslated `'вчера'`/`'2д'`/`aria-label="close"` strings moved into the
dictionaries · reduced-motion gating of the *idle* canvas animations.

Budgets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms; Lighthouse mobile
Perf ≥ 90 / A11y ≥ 95 / BP ≥ 95 / SEO ≥ 95, measured on the built output under
throttling. Deviations get documented with the measurement, not accepted silently.

Removals that buy the budget: unused `public/media/logo.png` (248 KB), GSAP off
the critical path (46 KB gzip), the per-frame allocation+sort in `sphere.ts`.

---

## 9. OLD → NEW (§2 — nothing disappears by accident)

| OLD | PURPOSE | NEW | VERIFY |
|---|---|---|---|
| Canvas voice sphere (`sphere.ts`) | show voice is alive | Waveform tape + large transcript + memory highlighting (§23). `sphere.ts` deleted **only after** the new carrier drives the same audio levels. Playback + dormant live path preserved. | E2E: play recording → level animates → transcript highlights |
| `.reveal` opacity/translateY on everything | make content arrive | six named patterns (§3) | visual regression per scene |
| Pinned day (`day--pinned`, 480vh, `100vh`) | temporal storytelling | matchMedia+context scene, `dvh`, mobile chronology | resize/rotate test asserts no stuck opacity |
| Hero app-window screenshot | prove the product is real | EXPAND reveal onto the same live window | E2E: all 6 panes reachable |
| 3 duplicated page files | 3 locales | `Landing.astro` + 3 four-line pages | build + 3 locale E2E |
| Gold accent on charcoal | brand voice | signal vermilion on ivory; gold survives in the product mark | contrast validator |
| Hardcoded RU kanban meta | card detail | dictionary keys in all 3 locales | E2E: no Cyrillic on /en/ |

---

## 10. PHASE ORDER

0 audit ✅ · 1 architecture ✅ · 2 tokens/type/layout · 3 i18n · 4 motion ·
5 intro+hero · 6 editorial sections · 7 session-aware · 8 live product ·
9 cursor/micro · 10 mobile · 11 a11y · 12 perf · 13 tests · 14 cross-browser ·
15 polish.

After every phase: build · tests · console · diff · verify critical functionality.
Broken ⇒ fix before advancing.
