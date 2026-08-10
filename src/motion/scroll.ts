/*
 * Scroll scrubbing — 60 lines instead of a 46 KB gzipped animation engine.
 *
 * The baseline shipped all of GSAP + ScrollTrigger on the critical path of every
 * desktop visit to drive one pinned section. After the redesign only two scenes
 * genuinely need *scrubbed* progress (the sentence taken apart into an order,
 * and the night shift's parallel tracks); everything else is IntersectionObserver
 * plus CSS. Two scenes do not justify an engine, so §44's answer is: don't.
 *
 * What this gives:
 *   - one shared rAF for every scene on the page, not one per scene
 *   - exactly one getBoundingClientRect per scene per frame, and only while the
 *     scene is on screen (an IntersectionObserver gates it)
 *   - progress is a pure function of scroll position, so a screenshot taken at
 *     a given scroll offset is deterministic — required for visual regression
 *   - nothing is written to the DOM by this module; scenes decide what to do
 */

import { register } from './lifecycle';
import { prefersReducedMotion } from './media';
import { onMedia } from './media';

export type ScrubHandler = (progress: number) => void;

interface Entry {
  el: HTMLElement;
  onProgress: ScrubHandler;
  /** extra scroll distance beyond the element's own height, in viewport heights */
  travel: number;
  visible: boolean;
  last: number;
}

const entries = new Set<Entry>();
let raf = 0;
let io: IntersectionObserver | null = null;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function frame() {
  raf = 0;
  let anyVisible = false;
  for (const e of entries) {
    if (!e.visible) continue;
    anyVisible = true;
    const r = e.el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // Cover progress: 0 when the element's top is at the bottom of the
    // viewport, 1 when its bottom has passed the top. Defined this way it
    // sweeps the full range for elements shorter than the viewport too — the
    // naive "own height minus viewport" version snaps 0→1 for short sections.
    const distance = vh + r.height + e.travel * vh;
    const p = distance <= 0 ? 0 : clamp01((vh - r.top) / distance);
    if (Math.abs(p - e.last) > 0.0005) {
      e.last = p;
      e.onProgress(p);
    }
  }
  if (anyVisible) raf = requestAnimationFrame(frame);
}

function kick() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function observer(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver(
      (list) => {
        for (const rec of list) {
          for (const e of entries) {
            if (e.el !== rec.target) continue;
            e.visible = rec.isIntersecting;
            if (e.visible) kick();
          }
        }
      },
      { rootMargin: '20% 0px' },
    );
  }
  return io;
}

export interface ScrubOptions {
  /** extra scroll length in viewport heights; 0 = the element's own height */
  travel?: number;
  /** run even with reduced motion (the handler must then be non-animating) */
  ignoreReducedMotion?: boolean;
}

/**
 * Drive `onProgress(0..1)` from `el`'s position in the scroll range.
 * With reduced motion the handler is called once with 1 — the scene renders in
 * its finished state and never moves.
 */
export function scrub(
  el: HTMLElement,
  onProgress: ScrubHandler,
  opts: ScrubOptions = {},
): () => void {
  if (prefersReducedMotion() && !opts.ignoreReducedMotion) {
    onProgress(1);
    return () => {};
  }

  const entry: Entry = {
    el,
    onProgress,
    travel: opts.travel ?? 0,
    visible: false,
    last: -1,
  };
  entries.add(entry);
  observer().observe(el);
  kick();

  return register(() => {
    entries.delete(entry);
    io?.unobserve(el);
    if (entries.size === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
      io?.disconnect();
      io = null;
    }
  });
}

/**
 * Fire `onEnter(index)` as each step scrolls into the reading zone, and
 * `onLeave` when scrolling back above the first one. Used by the day scene:
 * the clock is driven by which moment you are actually reading, not by a
 * scrubbed fraction, so it can never show a time no scene has.
 */
export function steps(
  els: HTMLElement[],
  onEnter: (index: number) => void,
): () => void {
  if (!els.length) return () => {};

  let current = -1;
  const set = (i: number) => {
    if (i === current) return;
    current = i;
    onEnter(i);
  };

  const stepIo = new IntersectionObserver(
    (list) => {
      // Choose the last step whose top has passed the reading line.
      let best = current;
      for (const rec of list) {
        const i = els.indexOf(rec.target as HTMLElement);
        if (i < 0) continue;
        if (rec.isIntersecting) best = Math.max(best, i);
        else if (rec.boundingClientRect.top > 0) best = Math.min(best, i - 1);
      }
      set(Math.max(0, best));
    },
    { rootMargin: '-35% 0px -45% 0px', threshold: 0 },
  );

  for (const el of els) stepIo.observe(el);
  onEnter(0);

  return register(() => stepIo.disconnect());
}

/** Re-measure after fonts settle and on orientation change (§42: never spam). */
export function initScrollRefresh(): () => void {
  const nudge = () => kick();
  if (document.fonts?.ready) void document.fonts.ready.then(nudge);
  window.addEventListener('orientationchange', nudge);
  const stop = onMedia('(orientation: portrait)', nudge, false);
  return register(() => {
    window.removeEventListener('orientationchange', nudge);
    stop();
  });
}
