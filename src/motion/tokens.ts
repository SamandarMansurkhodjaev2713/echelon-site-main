/*
 * Motion tokens — the single source of truth.
 * Mirrored into CSS custom properties in styles/tokens.css; the unit test in
 * tests/unit/motion.test.ts asserts the two stay in sync, so a value can never
 * drift between JS-driven and CSS-driven motion.
 */

export const DURATION = {
  /** micro-interaction: hover, toggle, caret */
  fast: 0.14,
  /** UI state change: pane swap, tab, filter */
  normal: 0.26,
  /** editorial reveal: a record arriving, a rule stamping */
  expressive: 0.52,
  /** a whole scene beat */
  scene: 0.9,
} as const;

export const EASE = {
  /** neutral, for state that simply changes */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** things arriving — decisive, no overshoot */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** things leaving */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** a decision landing — the only curve allowed to overshoot */
  snap: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
  /** long editorial moves: slow in, committed middle, slow out */
  editorial: 'cubic-bezier(0.62, 0.01, 0.16, 1)',
} as const;

export type DurationName = keyof typeof DURATION;
export type EaseName = keyof typeof EASE;

/** GSAP wants a cubic-bezier string; CSS wants the same. One converter, no drift. */
export const ease = (name: EaseName): string => EASE[name];
export const dur = (name: DurationName): number => DURATION[name];

/** Stagger steps, in seconds. Anything longer reads as a delay hack (§29). */
export const STAGGER = {
  tight: 0.035,
  normal: 0.055,
  loose: 0.09,
} as const;
