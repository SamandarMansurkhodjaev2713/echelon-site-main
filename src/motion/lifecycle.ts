/*
 * Cleanup registry. Every module that attaches a listener, starts a rAF loop or
 * creates a ScrollTrigger hands back a disposer here.
 *
 * The baseline's day scene broke precisely because nothing owned teardown: it
 * ran once on load and never reacted to the viewport leaving its breakpoint,
 * stranding four of five scenes at opacity 0. Scenes registered through
 * `scene()` cannot reproduce that — they are built and destroyed by the media
 * query itself.
 */

import { onMedia } from './media';

type Disposer = () => void;

const disposers = new Set<Disposer>();

/** Register a teardown function. Returns it, so callers can dispose early. */
export function register(dispose: Disposer): Disposer {
  disposers.add(dispose);
  return () => {
    if (disposers.delete(dispose)) dispose();
  };
}

/** Tear everything down. Used by tests and by the deterministic session reset. */
export function destroyAll(): void {
  for (const d of [...disposers]) {
    disposers.delete(d);
    try {
      d();
    } catch {
      /* a failing disposer must not block the rest */
    }
  }
}

export const activeCount = (): number => disposers.size;

/**
 * Build a scene only while a media query matches; destroy it the moment it
 * stops matching. `setup` returns its own disposer.
 */
export function scene(query: string, setup: () => Disposer | void): Disposer {
  let dispose: Disposer | void;
  const stop = onMedia(query, (matches) => {
    if (matches && !dispose) {
      dispose = setup();
    } else if (!matches && dispose) {
      dispose();
      dispose = undefined;
    }
  });
  return register(() => {
    stop();
    if (dispose) dispose();
    dispose = undefined;
  });
}

/** addEventListener that always comes back out again. */
export function listen<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  handler: (e: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): Disposer;
export function listen(
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): Disposer;
export function listen(
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): Disposer {
  target.addEventListener(type, handler, options);
  return register(() => target.removeEventListener(type, handler, options));
}

/**
 * A rAF loop that stops itself when the element leaves the viewport and when
 * the page is hidden. Both canvases on this site run through it.
 */
export function raf(
  el: Element,
  frame: (now: number, dt: number) => void,
  opts: { threshold?: number } = {},
): Disposer {
  let id = 0;
  let running = false;
  let last = 0;

  const tick = (now: number) => {
    if (!running) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    frame(now, dt);
    id = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    id = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(id);
  };

  let visible = false;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    },
    { threshold: opts.threshold ?? 0.05 },
  );
  io.observe(el);

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (visible) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return register(() => {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
