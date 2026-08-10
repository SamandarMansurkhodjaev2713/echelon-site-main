/*
 * Work tape driver.
 *
 * Sections declare which tape event they produce with `data-produces="<index>"`.
 * When a section has been read, its event is added to the rail. Nothing loops,
 * nothing animates on a timer: the rail only ever reflects how far through the
 * shift the visitor has got.
 */

import { register } from './lifecycle';
import { session } from '../session/state';

export function initTape(): () => void {
  const tape = document.querySelector<HTMLElement>('[data-tape]');
  if (!tape) return () => {};

  const rows = Array.from(tape.querySelectorAll<HTMLElement>('[data-tape-row]'));
  // Sections either advance the tape, contribute to the handover report, or both.
  const producers = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-produces], [data-action], [data-fact], [data-automation]',
    ),
  );
  if (!rows.length || !producers.length) return () => {};

  let highest = -1;

  const paint = (upTo: number) => {
    if (upTo <= highest) return;
    highest = upTo;
    tape.setAttribute('data-live', '');
    rows.forEach((row, i) => {
      if (i <= upTo) row.setAttribute('data-on', '');
      if (i < upTo) row.setAttribute('data-past', '');
      else row.removeAttribute('data-past');
    });
  };

  const store = session();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        if (el.dataset.produces !== undefined) {
          const index = Number(el.dataset.produces);
          if (Number.isFinite(index)) paint(index);
        }
        // The section also contributes to the handover report. `remember` is
        // idempotent, so scrolling back and forth cannot inflate the counts.
        const { action, fact, automation } = el.dataset;
        if (action) store.remember('actions', action);
        if (fact) store.remember('facts', fact);
        if (automation) store.remember('automations', automation);
      }
    },
    { rootMargin: '0px 0px -35% 0px', threshold: 0.01 },
  );

  for (const p of producers) io.observe(p);

  return register(() => io.disconnect());
}
