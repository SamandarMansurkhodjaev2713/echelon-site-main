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

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );

  const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
  for (const el of targets) io.observe(el);

  return register(() => io.disconnect());
}

/**
 * Force every reveal into its final state. Used by the visual-regression
 * harness so screenshots are never taken mid-transition (§37).
 */
export function settleAll(root: ParentNode = document): void {
  for (const el of root.querySelectorAll('[data-reveal]')) el.classList.add('is-in');
}
