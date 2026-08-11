/*
 * Environment queries. One MediaQueryList per question, shared by every module,
 * so nothing re-registers the same listener and everything agrees on the answer.
 */

const memo = new Map<string, MediaQueryList>();

export function mq(query: string): MediaQueryList {
  let m = memo.get(query);
  if (!m) {
    m = window.matchMedia(query);
    memo.set(query, m);
  }
  return m;
}

export const QUERY = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** a real mouse — the only place a custom cursor or hover-only affordance is allowed */
  finePointer: '(hover: hover) and (pointer: fine)',
  /** where scrubbed, pinned choreography earns its cost */
  stage: '(min-width: 62rem)',
  /** the compact staging */
  compact: '(max-width: 47.999rem)',
} as const;

export const prefersReducedMotion = () => mq(QUERY.reducedMotion).matches;

/**
 * `?motion=off` — freeze everything that animates on its own clock.
 *
 * Playwright's `animations: 'disabled'` stops CSS animations and transitions but
 * has no effect on a canvas requestAnimationFrame loop, so the attention field
 * and the voice core would have made every visual baseline flaky. Both read this
 * and render a single deterministic frame instead. It sits alongside the existing
 * `?intro=off` rather than keying off reduced-motion, so the visual suite can
 * still exercise the normal-motion styling of everything else.
 */
let frozen: boolean | null = null;
export function motionFrozen(): boolean {
  if (frozen === null) {
    try {
      frozen = new URLSearchParams(window.location.search).get('motion') === 'off';
    } catch {
      frozen = false;
    }
  }
  return frozen;
}
export const hasFinePointer = () => mq(QUERY.finePointer).matches;
export const isStage = () => mq(QUERY.stage).matches;
export const isCompact = () => mq(QUERY.compact).matches;

/** Scrubbed scroll choreography only where it is both possible and wanted. */
export const allowsSceneMotion = () => isStage() && !prefersReducedMotion();

/**
 * Subscribe to a media query with automatic cleanup.
 * Returns an unsubscribe function; `immediate` fires the handler once now.
 */
export function onMedia(
  query: string,
  handler: (matches: boolean) => void,
  immediate = true,
): () => void {
  const m = mq(query);
  const listener = (e: MediaQueryListEvent | MediaQueryList) => handler(e.matches);
  m.addEventListener('change', listener as EventListener);
  if (immediate) handler(m.matches);
  return () => m.removeEventListener('change', listener as EventListener);
}
