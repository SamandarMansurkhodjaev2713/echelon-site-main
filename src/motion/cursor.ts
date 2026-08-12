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
  let frame: HTMLElement | null = null;
  let raf = 0;
  let active = false;

  let tx = -100;
  let ty = -100;
  let x = -100;
  let y = -100;
  let state: CursorState = 'default';
  /* The element the cursor currently has, if any. Held rather than re-resolved
     per frame: the hit test belongs to pointermove and to the meaning watcher. */
  let held: HTMLElement | null = null;

  const build = () => {
    node = document.createElement('div');
    node.className = 'cursor';
    node.setAttribute('aria-hidden', 'true');
    node.dataset.state = 'default';
    labelNode = document.createElement('span');
    labelNode.className = 'cursor__label';
    node.append(labelNode);

    /*
     * THE FRAME.
     *
     * Four corner marks that close around whatever the pointer has acquired.
     *
     * The obvious upgrade for a cursor is magnetism, and this file's own rules
     * have forbidden it from the start — for good reason: a control that pulls
     * the pointer is a control that has moved the target after the reader
     * aimed, and on a page with a comparison table and a kanban board that
     * costs precision to buy an effect. This does the opposite. Nothing moves;
     * the cursor states what it has, in the same crop-mark language the page is
     * already set in, and the reader keeps every pixel of aim they had.
     */
    frame = document.createElement('div');
    frame.className = 'cursor-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.innerHTML = '<i></i><i></i><i></i><i></i>';

    document.body.append(frame, node);
    document.documentElement.setAttribute('data-cursor-on', '');
  };

  const destroyNode = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    node?.remove();
    frame?.remove();
    node = null;
    frame = null;
    labelNode = null;
    held = null;
    document.documentElement.removeAttribute('data-cursor-on');
  };

  const loop = () => {
    // exponential approach — fast enough that there is no perceived lag,
    // slow enough to read as one object rather than a jumping sprite
    const k = trail ? 0.28 : 1;
    x += (tx - x) * k;
    y += (ty - y) * k;
    if (node) node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

    /*
     * One rect read per frame, and only while something is actually held.
     *
     * The frame has to follow its element, and the element moves for reasons
     * the cursor never hears about: the page scrolls under a resting pointer,
     * a reveal finishes travelling, a pane swaps. Reading the rect here keeps
     * all of those correct for the price of a single measurement — this
     * module's budget rule is against per-frame *allocation* and against
     * hundreds of reads, not against one — and the alternative, listening to
     * scroll and resize and mutation to recompute it, is more code that agrees
     * less often.
     */
    if (frame && held) {
      const r = held.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        frame.style.transform = `translate3d(${r.left.toFixed(1)}px, ${r.top.toFixed(1)}px, 0)`;
        frame.style.width = `${r.width.toFixed(1)}px`;
        frame.style.height = `${r.height.toFixed(1)}px`;
      }
    }
    raf = requestAnimationFrame(loop);
  };

  /** Acquire or release the framed element. */
  const setHeld = (next: HTMLElement | null) => {
    if (next === held) return;
    held = next;
    if (!frame) return;
    frame.toggleAttribute('data-on', Boolean(next));
  };

  /*
   * The cursor over a dark band.
   *
   * Both the registration dot and the label chip are drawn in `--ink`, and the
   * cursor is appended to the body, so they resolve against the root palette
   * wherever the pointer happens to be — which meant that over the night band,
   * and now over the voice band, a dark dot and a dark chip sat on a near-black
   * ground. The cursor was not subtle there; it was gone, on precisely the two
   * sections that most need to feel alive under the hand.
   *
   * Asked of the element under the pointer rather than of the scroll position,
   * because that is the only thing that knows: the bands are full-width, but the
   * work-tape rail beside them is not, and a pointer resting on the rail is on
   * paper while the middle of the screen is on ink.
   */
  let inverted = false;
  const setGround = (el: Element | null) => {
    const dark = Boolean(el?.closest('.on-ink'));
    if (dark === inverted) return;
    inverted = dark;
    node?.toggleAttribute('data-inv', dark);
    frame?.toggleAttribute('data-inv', dark);
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
    const hit = resolveState(e.target as Element);
    setState(hit.state);
    setHeld(hit.state === 'default' ? null : hit.el);
    setGround(e.target as Element);
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
    const under = document.elementFromPoint(tx, ty);
    const hit = resolveState(under);
    setState(hit.state);
    setHeld(hit.state === 'default' ? null : hit.el);
    setGround(under);
  };

  const meaningWatcher = new MutationObserver(refresh);

  const onLeave = () => {
    active = false;
    node?.removeAttribute('data-visible');
    // the frame follows the pointer out of the window, or it is left holding
    // something nobody is pointing at
    setHeld(null);
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
