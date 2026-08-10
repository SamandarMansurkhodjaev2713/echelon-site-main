/*
 * Signature entry (§6).
 *
 * Not a loader. There is no percentage, no spinner, no logo spin, and nothing
 * is being waited for. What happens is a real operation: a request arrives, it
 * gets classified, context is found, an action is prepared — and the very rows
 * that recorded it then travel into their place in the hero while the headline
 * opens behind them. The brand is what the operation resolves into.
 *
 * There is no overlay. The intro moves the hero's own DOM, so the transition
 * into the hero is seamless by construction rather than by matching: the same
 * nodes are in the same places before and after. Only transforms and opacity
 * animate, so it cannot cause layout shift.
 *
 * Repeat visits inside the same tab replay only the last beat (~380 ms).
 */

import { register } from './lifecycle';
import { prefersReducedMotion } from './media';

export const INTRO_KEY = 'echelon_intro_v1';

/** Beat starts in ms, relative to intro start. */
const BEATS = [0, 420, 780, 1120] as const;
const SETTLE_AT = 1460;
const DONE_AT = 2240;
const SHORT_DONE_AT = 380;

export interface IntroOptions {
  /** override for tests */
  force?: 'full' | 'short' | 'off';
}

function hasSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* non-persistent session — the intro simply plays again */
  }
}

export function initIntro(opts: IntroOptions = {}): () => void {
  const root = document.documentElement;
  const stage = document.querySelector<HTMLElement>('[data-intro-stage]');

  const finish = () => {
    root.removeAttribute('data-intro');
    root.setAttribute('data-intro-done', '');
    document.querySelector('[data-intro-skip]')?.setAttribute('hidden', '');
    markSeen();
  };

  // The inline head script sets data-intro before first paint. If we got here
  // and it is absent, JS ordering already resolved it — nothing to do.
  if (!stage || !root.hasAttribute('data-intro')) {
    finish();
    return () => {};
  }

  const params = new URLSearchParams(window.location.search);
  const forced = opts.force ?? (params.get('intro') as IntroOptions['force']) ?? undefined;

  const mode: 'full' | 'short' | 'off' =
    forced ??
    (prefersReducedMotion() ? 'off' : hasSeen() ? 'short' : 'full');

  if (mode === 'off') {
    finish();
    return () => {};
  }

  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const clear = () => {
    for (const t of timers) window.clearTimeout(t);
    timers.length = 0;
  };

  const skip = () => {
    clear();
    root.setAttribute('data-intro-phase', 'settle');
    // one frame so the settle transition has a start value to run from
    requestAnimationFrame(() => at(60, finish));
  };

  const beats = Array.from(stage.querySelectorAll<HTMLElement>('[data-intro-beat]'));
  const skipBtn = document.querySelector<HTMLElement>('[data-intro-skip]');
  skipBtn?.removeAttribute('hidden');

  if (mode === 'short') {
    root.setAttribute('data-intro-phase', 'settle');
    for (const b of beats) b.setAttribute('data-shown', '');
    at(SHORT_DONE_AT, finish);
  } else {
    root.setAttribute('data-intro-phase', 'operate');
    beats.forEach((beat, i) => {
      const t = BEATS[Math.min(i, BEATS.length - 1)] ?? 0;
      at(t, () => beat.setAttribute('data-shown', ''));
    });
    at(SETTLE_AT, () => root.setAttribute('data-intro-phase', 'settle'));
    at(DONE_AT, finish);
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
  };

  window.addEventListener('keydown', onKey);
  skipBtn?.addEventListener('click', skip);
  // Any deliberate scroll means the visitor is already past the intro.
  window.addEventListener('wheel', skip, { once: true, passive: true });
  window.addEventListener('touchmove', skip, { once: true, passive: true });

  return register(() => {
    clear();
    window.removeEventListener('keydown', onKey);
    skipBtn?.removeEventListener('click', skip);
    finish();
  });
}
