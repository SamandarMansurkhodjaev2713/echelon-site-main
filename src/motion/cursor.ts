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
 *  - transform-only, one rAF; the loop reads layout only when the page has
 *    told it something moved, never speculatively
 *  - pointer-events: none, so selection, inputs and links behave natively
 *  - the native cursor is kept everywhere it carries meaning (text, inputs)
 *  - no magnetic buttons
 *  - and the one that governs all of it: IT IS NEVER WRONG. What it names is
 *    what is under the pointer, whatever the page did to get there.
 */

import { register, listen } from './lifecycle';
import { QUERY, prefersReducedMotion } from './media';
import { onMedia } from './media';

export const CURSOR_STATES = [
  'default',
  'view',
  'open',
  /*
   * The word the page was missing.
   *
   * Eleven controls on this page reverse: the masthead's index and the ten rows
   * of the vault open a thing and then close the same thing. Every one of them
   * declared `open` in both states, so with the panel up and the pointer resting
   * on the control that would put it away, the cursor said «Открыть». That is
   * the automations lie — a control naming the half of itself that has already
   * happened — and it was three times as common as the case that was fixed.
   */
  'close',
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
  close: string;
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
     per frame: the hit test runs when the pointer moves, and when the page says
     it has moved something — never on spec. */
  let held: HTMLElement | null = null;

  /*
   * WHAT IS UNDER THE POINTER CHANGES WITHOUT THE POINTER MOVING.
   *
   * This module resolved the world on pointermove, and on `data-cursor` changing
   * — which covers a control redefining itself, and nothing else. Everything the
   * page does on its own was invisible to it, and all four of these were live:
   *
   *   Rest on the hero's call to action and scroll. The label went on saying
   *   "Решить" and the frame went on chasing the button — measured at 11 901 px
   *   above the viewport after a jump to #night, still framing it, still naming
   *   an operation the reader was nowhere near.
   *
   *   Rest anywhere and let a control arrive under the pointer. 260 px of wheel
   *   put the primary call to action under a cursor that said nothing at all, so
   *   the one operation on the page that most needs naming could be clicked
   *   unnamed.
   *
   *   Open the index over a resting pointer. The pointer is on a row of the
   *   shift; the cursor has not noticed the panel exists.
   *
   *   And the one that shows: scroll the night band under a resting pointer and
   *   the dot stays rgb(21,20,15) — ink on ink. `setGround` below exists for
   *   exactly this, and it was only ever asked on pointermove, so the cursor
   *   disappeared on the two sections it was written to survive.
   *
   * The settling argument is that the platform does not behave this way. `:hover`
   * moves to a control that scrolls under a still mouse — measured, true — so the
   * native `cursor: pointer` this replaced *would* have changed. Anything less is
   * a regression against the thing it was put in front of.
   *
   * So: the page says when it may have moved, and the resolve happens once on the
   * next frame. One `elementFromPoint` costs 50–88 µs here, 0.5 % of a frame at
   * worst, and it is spent only on frames after something actually happened. The
   * flag also bounds the damage by construction: however noisy the sources get,
   * this can never cost more than one hit test per frame.
   */
  let dirty = false;
  const invalidate = () => {
    dirty = true;
  };

  /* Viewport and the label's own offsets, cached. The label's placement is
     decided every frame and must not pay a layout read to do it. */
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let offX = 11.2;
  let offY = 10.4;
  let labelW = 0;
  let labelH = 0;
  let flipX = false;
  let flipY = false;
  /* how close to the edge the label may come before it takes the other side */
  const EDGE = 6;

  /* The label's offset from the pointer lives in the stylesheet, in rem, so it
     is read from there rather than duplicated as a number here. Once at build
     and once per resize: when the label has taken the other side, its `left` is
     `auto` and the previous reading stands. */
  const measureOffsets = () => {
    if (!labelNode) return;
    const cs = getComputedStyle(labelNode);
    const l = parseFloat(cs.left);
    const t = parseFloat(cs.top);
    if (Number.isFinite(l)) offX = l;
    if (Number.isFinite(t)) offY = t;
  };

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
    measureOffsets();
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
    /*
     * Everything the module remembers about the world goes with the nodes.
     *
     * This layer is torn down and rebuilt whenever the pointer stops being fine
     * and becomes fine again — a mouse unplugged from a hybrid machine and
     * plugged back in. `build()` starts the new node at `data-state="default"`,
     * but these variables survived, and every setter here is guarded on "has it
     * changed": `setState('approve')` when `state` already said `approve`
     * returned without writing anything. Measured: after one coarse round trip
     * the cursor comes back permanently mute — the dot over the decide button,
     * `data-state` stuck at default, no name — for the rest of the session.
     *
     * The same applies to the ground, which would have come back believing it was
     * still inverted, and to the label's measurements, which belong to a node
     * that no longer exists.
     *
     * `active` is the one that list missed, and it is the worst of them. It means
     * "the pointer has moved at least once, so we know where it is", and it gates
     * the write of `data-visible`, which is what lifts the layer out of
     * `opacity: 0; visibility: hidden`. Carried across a rebuild it reads as
     * already true, so that write never runs on the fresh node.
     *
     * `onEnter` writes the same attribute and is *not* guarded, which is why this
     * is survivable at all in the ordinary case — but `pointerenter` fires when
     * the pointer enters the document, and a pointer that was inside the whole
     * time never enters it again. A rebuild happens under a pointer that is
     * already there, so the unguarded writer is exactly the one that cannot help.
     * Measured: after one round trip the cursor is rebuilt, follows
     * the pointer, resolves the hero's call to action and sets `data-state` to
     * `approve` with the label reading «Решить» — and is `visibility: hidden` for
     * the rest of the session, moving away and back included.
     *
     * The gate written for the rebuild watched `data-state` and the label, which
     * are exactly the two things that stayed right, so it passed over an invisible
     * cursor. It now compares the whole appearance against the same reading taken
     * before the round trip, which is the only version of this check that does not
     * have to guess in advance which field the next miss will be in.
     */
    state = 'default';
    active = false;
    inverted = false;
    labelW = 0;
    labelH = 0;
    flipX = false;
    flipY = false;
    dirty = false;
    document.documentElement.removeAttribute('data-cursor-on');
  };

  const loop = () => {
    /* Something moved since the last frame; ask the page what is under the
       pointer now. Once, here, rather than at every source that could have
       caused it. */
    if (dirty) {
      dirty = false;
      refresh();
    }

    // exponential approach — fast enough that there is no perceived lag,
    // slow enough to read as one object rather than a jumping sprite
    const k = trail ? 0.28 : 1;
    x += (tx - x) * k;
    y += (ty - y) * k;
    if (node) node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

    /*
     * THE LABEL TAKES THE SIDE THAT FITS.
     *
     * It sat below and to the right of the dot always, which is fine until the
     * pointer is near an edge — and the controls nearest the right edge of this
     * page are the masthead's "Решить" and the language links, the two most
     * likely to be aimed at. Measured: at 1152 the CTA cuts its own label by
     * 15 px over its last 15 px, at 1024 by 20 px, and the Uzbek wording is half
     * again longer than the Russian it was checked against. A cursor whose whole
     * purpose is to name the operation must not put the name off the screen.
     *
     * Only the label moves. The dot stays exactly where the pointer is — this
     * page has a comparison table and a kanban board on it, and the reader keeps
     * every pixel of aim they had. It flips only if the other side actually
     * fits, so a narrow window cannot push it off the opposite edge instead.
     */
    if (node && labelW) {
      const wantX = x + offX + labelW > vw - EDGE && x - offX - labelW > EDGE;
      const wantY = y + offY + labelH > vh - EDGE && y - offY - labelH > EDGE;
      if (wantX !== flipX) {
        flipX = wantX;
        node.toggleAttribute('data-flip-x', wantX);
      }
      if (wantY !== flipY) {
        flipY = wantY;
        node.toggleAttribute('data-flip-y', wantY);
      }
    }

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
      } else {
        /* An empty box means the thing being framed has left the layout — hidden,
           unmounted, or collapsed — while the cursor was holding it. Whatever did
           that, the frame must not go on drawing a box around it at its last
           remembered size, so the world is re-read instead. This costs nothing:
           the rect is already in hand. */
        invalidate();
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
    /* One measurement per change of wording, so the placement decision in the
       loop is arithmetic on numbers already in hand. Nine words per locale, each
       measured the first time it is used. */
    const r = labelNode.getBoundingClientRect();
    labelW = r.width;
    labelH = r.height;
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

  /*
   * The watcher answers two different questions, so it watches two things.
   *
   * `data-cursor` is the exact one: the contract is that the attribute *is* the
   * meaning, so a control redefining itself is seen precisely. `class`, `hidden`
   * and insertions are the approximate one — they are how something comes to be
   * over the pointer that was not there before. The index panel is the measured
   * case, and it opens by toggling a class, so the exact filter alone missed it.
   *
   * Approximate is affordable here because the callback only raises a flag: the
   * work is done once on the next frame no matter how many records arrive. The
   * module's own writes are skipped, or setting the label's text would invalidate
   * the reading that produced it.
   */
  const meaningWatcher = new MutationObserver((records) => {
    for (const m of records) {
      const t = m.target;
      if (node && (node === t || node.contains(t))) continue;
      if (frame && (frame === t || frame.contains(t))) continue;
      invalidate();
      return;
    }
  });

  const onResize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    measureOffsets();
    invalidate();
  };

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
      childList: true,
      attributes: true,
      attributeFilter: ['data-cursor', 'class', 'hidden'],
    });
    disposers.push(
      () => meaningWatcher.disconnect(),
      listen(window, 'pointermove', onMove as EventListener, { passive: true }),
      /* Capture, because the document is not the only thing that scrolls: the
         demo's own panes do too, and a pane scrolling under a resting pointer is
         the same lie as the page doing it. Scroll events do not bubble, so
         listening on the document without capture would hear only the page. */
      listen(document, 'scroll', invalidate, { passive: true, capture: true }),
      listen(window, 'resize', onResize, { passive: true }),
      /*
       * A mutation says something *began* to move; these say it has arrived.
       *
       * The index panel is the case that needs both. It opens by transitioning
       * its clip, so at the frame the class lands the panel does not cover the
       * pointer yet and the reading taken there is of the page behind it — the
       * cursor was left one step behind, naming the index only once the index
       * had closed again. Escape-closing while the pointer rests on a row is the
       * everyday version: the panel goes, and without this the label goes on
       * offering to open a section that is no longer on the screen.
       *
       * The start and the end are read, not the middle: tracking a transition
       * frame by frame would mean hit-testing every frame, which is the cost this
       * whole arrangement exists to avoid. Nothing on this page needs the middle.
       */
      listen(document, 'transitionend', invalidate, { passive: true }),
      listen(document, 'animationend', invalidate, { passive: true }),
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
