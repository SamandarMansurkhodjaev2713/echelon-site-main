/*
 * THE SHIFT CLOCK — the page's single source of time.
 *
 * The whole site is one working shift. How far the visitor has read *is* what
 * time it is. Three things need to agree about that: the ambient light on the
 * paper, how busy the attention field is, and the clock in the masthead. Giving
 * each its own scroll listener would guarantee they drift apart, so they all
 * subscribe here instead.
 *
 * The clock is not an arbitrary ramp across the scroll height. Sections declare
 * the time they depict with `data-shift="HH:MM"`, and the clock interpolates
 * between those anchors by real pixel position. So the light changes because
 * the *content* says the day moved on, not because a magic number said so — and
 * reordering or resizing a section cannot desynchronise them.
 *
 * Everything here is a pure function of scroll offset, which the visual suite
 * depends on: a screenshot taken at a given offset is deterministic.
 */

import { register } from './lifecycle';

export interface ShiftState {
  /** 0..1 — position through the whole document */
  progress: number;
  /** minutes since 00:00 of day one; runs past 1440 into the next morning */
  minutes: number;
  /** 0..1 sky darkness at `minutes`. 0 = full daylight, 1 = deep night */
  night: number;
}

interface Anchor {
  /** document y of the anchor's own top */
  y: number;
  minutes: number;
}

type Listener = (s: ShiftState) => void;

const listeners = new Set<Listener>();
let anchors: Anchor[] = [];
let frame = 0;
let bound = false;

const state: ShiftState = { progress: 0, minutes: 9 * 60, night: 0 };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** "23:00" → 1380. A value smaller than the previous anchor means the next day. */
function parseClock(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Sky darkness. Flat daylight through the working day, a real dusk ramp across
 * the evening, full night after 22:00, and a dawn that lifts by 07:00 — so the
 * handover at 07:10, which is the next morning, reads as morning again.
 */
export function nightAt(minutes: number): number {
  const t = ((minutes % 1440) + 1440) % 1440;
  if (t >= 480 && t < 1020) return 0; // 08:00–17:00 — flat daylight
  if (t >= 1020 && t < 1320) return clamp01((t - 1020) / 300); // 17:00–22:00 dusk
  if (t >= 1320 || t < 270) return 1; // 22:00–04:30 — full night
  if (t < 420) return 1 - clamp01((t - 270) / 150); // 04:30–07:00 dawn
  return 0;
}

function collectAnchors(): void {
  const found: Anchor[] = [];
  let previous = -1;
  let dayOffset = 0;

  for (const el of document.querySelectorAll<HTMLElement>('[data-shift]')) {
    const raw = parseClock(el.dataset.shift ?? '');
    if (raw === null) continue;
    // A time that goes backwards is the next day — the handover is tomorrow
    // morning, not a rewind to this morning.
    if (previous >= 0 && raw + dayOffset < previous) dayOffset += 1440;
    const minutes = raw + dayOffset;
    previous = minutes;
    found.push({ y: el.getBoundingClientRect().top + window.scrollY, minutes });
  }

  anchors = found.sort((a, b) => a.y - b.y);
}

function minutesAt(y: number): number {
  if (!anchors.length) return 9 * 60;
  const first = anchors[0]!;
  const last = anchors[anchors.length - 1]!;
  if (y <= first.y) return first.minutes;
  if (y >= last.y) return last.minutes;

  for (let i = 1; i < anchors.length; i++) {
    const b = anchors[i]!;
    if (y > b.y) continue;
    const a = anchors[i - 1]!;
    const span = b.y - a.y;
    const t = span <= 0 ? 1 : (y - a.y) / span;
    return lerp(a.minutes, b.minutes, t);
  }
  return last.minutes;
}

function measure(): void {
  const doc = document.documentElement;
  const vh = window.innerHeight || 1;
  const max = Math.max(1, doc.scrollHeight - vh);
  const y = window.scrollY;

  state.progress = clamp01(y / max);
  // The reading line sits a third down the viewport — that is the part of the
  // page a person is actually looking at, not the very top edge.
  state.minutes = minutesAt(y + vh * 0.34);
  state.night = nightAt(state.minutes);

  for (const fn of listeners) fn(state);
}

function schedule(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    measure();
  });
}

function bind(): void {
  if (bound) return;
  bound = true;

  const remeasure = () => {
    collectAnchors();
    measure();
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure);
  if (document.fonts?.ready) void document.fonts.ready.then(remeasure);

  collectAnchors();
  measure();

  register(() => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', remeasure);
    cancelAnimationFrame(frame);
    frame = 0;
    bound = false;
    listeners.clear();
  });
}

/** Subscribe to the shift clock. Fires immediately with the current state. */
export function onShift(fn: Listener): () => void {
  listeners.add(fn);
  bind();
  fn(state);
  return () => listeners.delete(fn);
}

/** Read the clock without subscribing. */
export const shiftNow = (): ShiftState => state;

/** "09:00" for display. Wraps past midnight. */
export function formatClock(minutes: number): string {
  const t = Math.round(((minutes % 1440) + 1440) % 1440);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
