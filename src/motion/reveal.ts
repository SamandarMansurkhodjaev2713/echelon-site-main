/*
 * The six reveal patterns (§7/§14), driven by one IntersectionObserver for the
 * whole page. No GSAP, no per-element listener, no layout reads.
 *
 * Markup: data-reveal="receive|resolve|archive|escalate|expand|handover"
 *         data-stagger on a parent numbers its children for sequencing.
 *
 * The transition itself lives in CSS (styles/base.css) so that reduced-motion
 * and no-JS are handled declaratively rather than by branching here.
 */

import { register } from './lifecycle';

export const PATTERNS = [
  'receive',
  'resolve',
  'archive',
  'escalate',
  'expand',
  'handover',
] as const;

export type Pattern = (typeof PATTERNS)[number];

export function initReveal(root: ParentNode = document): () => void {
  // Number staggered children once, so CSS can compute per-child delay.
  for (const group of root.querySelectorAll<HTMLElement>('[data-stagger]')) {
    let i = 0;
    for (const child of group.children) {
      (child as HTMLElement).style.setProperty('--i', String(i++));
    }
  }

  const pending = new Set<HTMLElement>(root.querySelectorAll<HTMLElement>('[data-reveal]'));

  const show = (el: Element) => {
    el.classList.add('is-in');
    io.unobserve(el);
    pending.delete(el as HTMLElement);
    if (!pending.size) stopSweep();
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        show(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );

  for (const el of pending) io.observe(el);

  /*
   * The observer is the mechanism; this is the guarantee.
   *
   * A section that is plainly on the screen and still at zero opacity is the
   * worst failure this module can produce — the reader is looking at a blank
   * band and there is nothing they can do about it. That happened after a scroll
   * that jumps the page instead of travelling it: intersections are computed at
   * frame boundaries, and an element the viewport crossed *between* two frames
   * can end up never producing a callback at all. Rare, engine-dependent, and
   * exactly the kind of thing that reaches a visitor rather than a test.
   *
   * So the same condition the observer uses is re-checked on scroll, at most once
   * per frame, and only over the reveals that are still waiting. It costs one
   * bounding-box read per pending element per frame while any remain, and the
   * listener removes itself the moment the last one has appeared — so on a page
   * that has been read to the bottom this is not running at all.
   */
  let frame = 0;
  const sweep = () => {
    frame = 0;
    const limit = window.innerHeight * 0.94; //  matches the observer's bottom margin
    for (const el of [...pending]) {
      const r = el.getBoundingClientRect();
      if (r.height <= 0) continue;
      const shown = Math.min(r.bottom, limit) - Math.max(r.top, 0);
      if (shown / r.height >= 0.06) show(el);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sweep);
  };
  function stopSweep() {
    window.removeEventListener('scroll', schedule);
    cancelAnimationFrame(frame);
    frame = 0;
  }
  if (pending.size) window.addEventListener('scroll', schedule, { passive: true });

  return register(() => {
    stopSweep();
    io.disconnect();
  });
}

/**
 * Force every reveal into its final state. Used by the visual-regression
 * harness so screenshots are never taken mid-transition (§37).
 */
export function settleAll(root: ParentNode = document): void {
  for (const el of root.querySelectorAll('[data-reveal]')) el.classList.add('is-in');
}
