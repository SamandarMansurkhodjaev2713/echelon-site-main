/*
 * Smart contextual cursor (§11).
 *
 * Not a circle that follows the mouse. It reads the *semantic action* under the
 * pointer from `data-cursor` and states what would happen — OPEN, RUN, SPEAK,
 * APPROVE, DRAG. On this site that is the point: ECHELON is a thing that names
 * the operation before it performs it, and so does the cursor.
 *
 * Constraints honoured:
 *  - fine pointers only; touch and coarse pointers never see it
 *  - transform-only, one rAF, no layout reads in the loop
 *  - pointer-events: none, so selection, inputs and links behave natively
 *  - the native cursor is kept everywhere it carries meaning (text, inputs)
 *  - no magnetic buttons
 */

import { register, listen } from './lifecycle';
import { QUERY, prefersReducedMotion } from './media';
import { onMedia } from './media';

export const CURSOR_STATES = [
  'default',
  'view',
  'open',
  'run',
  'hold',
  'drag',
  'speak',
  'stop',
  'return',
  'approve',
] as const;

export type CursorState = (typeof CURSOR_STATES)[number];

export interface CursorLabels {
  view: string;
  open: string;
  run: string;
  hold: string;
  drag: string;
  speak: string;
  stop: string;
  return: string;
  approve: string;
}

/** Resolve the state for a pointer target: nearest ancestor that declares one. */
export function resolveState(target: Element | null): {
  state: CursorState;
  el: HTMLElement | null;
} {
  const el = target?.closest<HTMLElement>('[data-cursor]') ?? null;
  const raw = el?.dataset.cursor as CursorState | undefined;
  return {
    state: raw && (CURSOR_STATES as readonly string[]).includes(raw) ? raw : 'default',
    el,
  };
}

export function initCursor(labels: CursorLabels): () => void {
  // Reduced motion still gets the cursor — it is information, not decoration —
  // but it snaps instead of trailing.
  const trail = !prefersReducedMotion();

  let node: HTMLElement | null = null;
  let labelNode: HTMLElement | null = null;
  let raf = 0;
  let active = false;

  let tx = -100;
  let ty = -100;
  let x = -100;
  let y = -100;
  let state: CursorState = 'default';

  const build = () => {
    node = document.createElement('div');
    node.className = 'cursor';
    node.setAttribute('aria-hidden', 'true');
    node.dataset.state = 'default';
    labelNode = document.createElement('span');
    labelNode.className = 'cursor__label';
    node.append(labelNode);
    document.body.append(node);
    document.documentElement.setAttribute('data-cursor-on', '');
  };

  const destroyNode = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    node?.remove();
    node = null;
    labelNode = null;
    document.documentElement.removeAttribute('data-cursor-on');
  };

  const loop = () => {
    // exponential approach — fast enough that there is no perceived lag,
    // slow enough to read as one object rather than a jumping sprite
    const k = trail ? 0.28 : 1;
    x += (tx - x) * k;
    y += (ty - y) * k;
    if (node) node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = requestAnimationFrame(loop);
  };

  const setState = (next: CursorState) => {
    if (next === state || !node || !labelNode) return;
    state = next;
    node.dataset.state = next;
    labelNode.textContent = next === 'default' ? '' : (labels[next] ?? '');
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX;
    ty = e.clientY;
    if (!active) {
      active = true;
      x = tx;
      y = ty;
      node?.setAttribute('data-visible', '');
    }
    setState(resolveState(e.target as Element).state);
  };

  /*
   * Re-read the state without the pointer having moved.
   *
   * Resolving only on pointermove assumes a control means the same thing for as
   * long as the pointer rests on it, and controls do not work that way: pressing
   * play turns that same button into stop. The cursor went on announcing
   * "Слушать" over a button that would now halt playback — a cursor that names
   * the wrong operation is worse than one that names none, and naming the
   * operation is this cursor's entire reason to exist.
   *
   * The contract is that `data-cursor` *is* the meaning, so watching that
   * attribute is exact rather than approximate: no polling, no timers, and the
   * hit test only runs when a control has actually redefined itself.
   */
  const refresh = () => {
    if (!active || !node) return;
    setState(resolveState(document.elementFromPoint(tx, ty)).state);
  };

  const meaningWatcher = new MutationObserver(refresh);

  const onLeave = () => {
    active = false;
    node?.removeAttribute('data-visible');
  };
  const onEnter = () => {
    if (node) node.setAttribute('data-visible', '');
  };
  const onDown = () => node?.setAttribute('data-pressed', '');
  const onUp = () => node?.removeAttribute('data-pressed');

  const disposers: Array<() => void> = [];

  const attach = () => {
    build();
    raf = requestAnimationFrame(loop);
    meaningWatcher.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-cursor'],
    });
    disposers.push(
      () => meaningWatcher.disconnect(),
      listen(window, 'pointermove', onMove as EventListener, { passive: true }),
      listen(document, 'pointerdown', onDown, { passive: true }),
      listen(document, 'pointerup', onUp, { passive: true }),
      listen(document, 'pointerleave', onLeave),
      listen(document, 'pointerenter', onEnter),
      // a touch anywhere means this is not a mouse session after all
      listen(window, 'touchstart', detach as EventListener, { passive: true, once: true }),
    );
  };

  function detach() {
    while (disposers.length) disposers.pop()?.();
    destroyNode();
  }

  const stopWatching = onMedia(QUERY.finePointer, (fine) => {
    if (fine && !node) attach();
    else if (!fine && node) detach();
  });

  return register(() => {
    stopWatching();
    detach();
  });
}
