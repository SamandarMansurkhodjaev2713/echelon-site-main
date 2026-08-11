/*
 * THE ATTENTION FIELD — what the machine is doing while you read.
 *
 * The original art direction made the site a *journal*: a record of work already
 * done. Past tense, for a product whose entire claim is that something is running
 * right now, on your machine, while you are not looking. This layer supplies the
 * present tense.
 *
 * WHY IT LOOKS LIKE THIS. The first attempt was a node mesh with nearest-
 * neighbour edges, and it came out as the exact floating-dots-and-lines wallpaper
 * every AI landing page ships — organic, triangulated, decorative, and saying
 * nothing about this product. What ECHELON actually does is *route*: work arrives
 * on a channel, gets classified, travels to the person or project it belongs to,
 * and waits at the owner for a decision. So the field is a switchboard, not a
 * constellation — stations snapped to a lattice, orthogonal runs between them,
 * and events travelling those runs. Right angles and hairlines are also the
 * language the rest of the page is already set in, so it belongs here rather than
 * being imported from someone else's landing page.
 *
 *   STRATUM — a column of event ticks scrolling upward in the machine channel
 *     (the right-hand strip the layout already reserves). Never stops, never
 *     repeats: the tick at virtual index i is a pure function of i.
 *
 *   SWITCHBOARD — the routing layer described above. A watermark under paper;
 *     the subject where the paper ends.
 *
 * WHERE THE GROUND COMES FROM. Sections paint their paper over this fixed canvas,
 * so wherever paper exists the field can only be a watermark. That is right for
 * the reading sections and wrong for the dark bands, which exist to show the
 * machine with nothing in front of it.
 *
 * Two wrong answers were tried first. Laying an 82 % black veil over the canvas
 * washed the band out to brown, because what showed through was the light body
 * ground, not the machine. Dropping the veil to zero and letting this module fill
 * the band itself looked right and failed accessibility outright: axe reads CSS,
 * not canvases, so the computed style said light text on light paper — and it was
 * correct to, because any failure of the canvas would have left the band
 * genuinely unreadable rather than merely undecorated.
 *
 * So a dark band keeps a real, opaque CSS background and carries its *own*
 * canvas, `[data-band-field]`, sitting between that background and its text. The
 * switchboard is procedural, so the same geometry renders into it in the band's
 * own coordinates — which also means it scrolls with the section instead of being
 * pinned to the viewport: the machine is in the room rather than behind a window.
 *
 * HOW IT STAYS OUT OF THE WAY. Nothing is drawn over text. Not "mostly" — the
 * module builds an occupancy grid of every text box on the page and reads it per
 * point, so the guard follows the real layout in every locale and at every
 * viewport instead of guessing at a column. That is a hard requirement: a moving
 * background behind body copy is the readability failure this whole pass exists
 * to fix, and it must not be reintroduced in the name of atmosphere.
 *
 * Budget rules, learned from the baseline audit (the old sphere allocated and
 * sorted 460 elements *per frame*):
 *   - every buffer is a typed array allocated once and reused
 *   - nothing is allocated, sorted, stringified or style-read inside the loop
 *   - the only per-frame layout read is window.scrollY, which forces nothing
 *   - the loop is gated by IntersectionObserver + page visibility via raf()
 *   - device pixel ratio is capped at 2
 *   - reduced motion renders one deterministic frame per scroll position
 */

import { raf, register, listen } from './lifecycle';
import { prefersReducedMotion, isCompact, motionFrozen } from './media';
import { onShift, type ShiftState } from './shift';

/* ---------------------------------------------------------------- budget --- */

const STATIONS_WIDE = 58;
const STATIONS_COMPACT = 24;
const EVENTS = 18;
/** Longest orthogonal run, as a fraction of the viewport. Keeps routes local. */
const MAX_RUN = 0.17;
/** Samples behind a travelling event. This is what makes it read as motion. */
const TRAIL = 5;

/** Virtual pixels between two stratum ticks. */
const TICK_GAP = 26;
/** Stratum scroll speed in virtual px/s when the machine is idle. */
const TICK_SPEED = 15;
/** Below this the reserved rail is too narrow to host the stratum. */
const MIN_CHANNEL = 56;

/** Occupancy grid resolution, CSS px. */
const CELL = 34;
/** How fast the guard opens up away from text: 255/STEP cells to fully clear. */
const CHAMFER = 58;

/* --------------------------------------------------------------- helpers --- */

/** Deterministic PRNG — identical layout every load, which visual regression needs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable hash of a tick index → 0..1. Lets the stratum be infinite and stateless. */
function hash01(i: number): number {
  let t = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  t ^= t >>> 13;
  t = Math.imul(t, 0xc2b2ae35);
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Read a CSS custom property as [r,g,b]. */
function readRgb(el: Element, prop: string, fallback: [number, number, number]) {
  const raw = getComputedStyle(el).getPropertyValue(prop).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (m) {
    const n = parseInt(m[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
  }
  const fn = /rgba?\(([^)]+)\)/.exec(raw);
  if (fn) {
    const parts = fn[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3) return [parts[0]!, parts[1]!, parts[2]!] as [number, number, number];
  }
  return fallback;
}

/*
 * Everything that carries a mark the field must not draw over.
 *
 * The field's own canvases are excluded, and must be: a band canvas fills its
 * whole section, so counting it as occupied would mark that entire section as
 * text and the switchboard would refuse to draw in the one place it matters most.
 * The voice core is *not* excluded — that one really is something to stay off.
 */
const OCCUPIED = [
  'h1', 'h2', 'h3', 'h4', 'p', 'li', 'figure', 'blockquote', 'table',
  'button', 'a', 'input', 'img', 'svg', 'dl', '.ui', '.tape',
  'canvas:not([data-field]):not([data-band-field])',
].join(',');

/* ------------------------------------------------------------------ init --- */

export interface FieldOptions {
  /** override the reduced-motion decision, for tests */
  force?: 'full' | 'static';
}

export function initField(opts: FieldOptions = {}): () => void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-field]');
  if (!canvas) return () => {};
  const surface2d = canvas.getContext('2d', { alpha: true });
  if (!surface2d) return () => {};
  // Re-bound with an explicit type: the draw functions below are hoisted
  // declarations, so TypeScript considers them created *before* the guard above
  // and will not carry its narrowing into them.
  const ctx: CanvasRenderingContext2D = surface2d;

  const staticOnly =
    opts.force === 'static' || (opts.force !== 'full' && (prefersReducedMotion() || motionFrozen()));
  const S = isCompact() ? STATIONS_COMPACT : STATIONS_WIDE;
  /** Routes are built from station pairs; two per station is plenty. */
  const R = S * 2;

  /* ---------- the switchboard, allocated once ---------- */

  const sxN = new Float32Array(S); //  normalised station position, lattice-snapped
  const syN = new Float32Array(S);
  const sx = new Float32Array(S); //  resolved pixels
  const sy = new Float32Array(S);
  const sKind = new Uint8Array(S); //  0 person · 1 project · 2 agreement · 3 channel · 4 owner
  /** brief brightening when an event lands, 0..1, decays each frame */
  const sHit = new Float32Array(S);

  const rA = new Uint16Array(R);
  const rB = new Uint16Array(R);
  /** true when the run goes horizontal first, then vertical */
  const rHFirst = new Uint8Array(R);
  let routeCount = 0;

  const evRoute = new Int16Array(EVENTS).fill(-1);
  const evT = new Float32Array(EVENTS);
  const evSpeed = new Float32Array(EVENTS);
  const evKind = new Uint8Array(EVENTS);

  const rand = mulberry32(0x3c4e10);

  // Stations sit on a lattice. Snapping is what makes a switchboard read as
  // designed rather than scattered, and it lets every run be a clean right angle.
  const LAT_X = 26;
  const LAT_Y = 18;
  const taken = new Set<number>();
  for (let i = 0; i < S; i++) {
    let gx = 0;
    let gy = 0;
    for (let tries = 0; tries < 24; tries++) {
      // Bias to the sides: the middle of the page is where the reading happens.
      const side = rand() < 0.5 ? -1 : 1;
      gx = Math.round(LAT_X / 2 + side * Math.pow(rand(), 0.7) * (LAT_X / 2));
      gy = Math.round(rand() * LAT_Y);
      const key = gy * (LAT_X + 1) + gx;
      if (!taken.has(key)) {
        taken.add(key);
        break;
      }
    }
    sxN[i] = gx / LAT_X;
    syN[i] = gy / LAT_Y;
    const k = rand();
    sKind[i] = k < 0.42 ? 0 : k < 0.66 ? 1 : k < 0.85 ? 2 : 3;
  }
  // One owner. Everything in the product routes back to a single person.
  sKind[0] = 4;

  // Runs join stations that share a lattice row or column where possible, and
  // otherwise turn exactly once. Never a diagonal: this is a switchboard.
  for (let a = 0; a < S && routeCount < R; a++) {
    for (let b = a + 1; b < S && routeCount < R; b++) {
      const dx = Math.abs(sxN[a]! - sxN[b]!);
      const dy = Math.abs(syN[a]! - syN[b]!);
      if (dx > MAX_RUN || dy > MAX_RUN) continue;
      if (dx + dy < 0.02) continue;
      if (rand() > 0.3) continue;
      rA[routeCount] = a;
      rB[routeCount] = b;
      rHFirst[routeCount] = rand() < 0.5 ? 1 : 0;
      routeCount++;
    }
  }

  /* ---------- surface ---------- */

  let dpr = 1;
  let w = 0;
  let h = 0;
  let chanX = 0; //  machine channel, CSS px
  let chanW = 0;
  /* The work tape's fixed box inside that same channel. The strip yields to it. */
  let logTop = -1;
  let logBottom = -1;
  let logTextX = 0;

  /* ---------- occupancy grid ----------
     A coarse map of the whole document: 0 where a text box is, 255 where the
     page is empty, with a chamfered ramp between the two so the guard has soft
     edges instead of a rectangular hole. Rebuilt on resize and after the fonts
     land — never inside the frame loop. */

  let grid = new Uint8Array(0);
  let gCols = 0;
  let gRows = 0;

  function buildGrid(): void {
    const docH = Math.max(document.documentElement.scrollHeight, h);
    gCols = Math.max(1, Math.ceil(w / CELL));
    gRows = Math.max(1, Math.ceil(docH / CELL));
    const need = gCols * gRows;
    if (grid.length < need) grid = new Uint8Array(need);
    grid.fill(255, 0, need);

    const sy0 = window.scrollY;
    for (const el of document.querySelectorAll(OCCUPIED)) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      const x0 = Math.max(0, Math.floor(r.left / CELL));
      const x1 = Math.min(gCols - 1, Math.floor((r.right - 1) / CELL));
      const y0 = Math.max(0, Math.floor((r.top + sy0) / CELL));
      const y1 = Math.min(gRows - 1, Math.floor((r.bottom + sy0 - 1) / CELL));
      for (let gy = y0; gy <= y1; gy++) {
        const row = gy * gCols;
        for (let gx = x0; gx <= x1; gx++) grid[row + gx] = 0;
      }
    }

    // Two-pass chamfer: an approximate distance transform, so the guard opens
    // gradually over a few cells rather than snapping at a box edge.
    for (let y = 0; y < gRows; y++) {
      const row = y * gCols;
      const up = row - gCols;
      for (let x = 0; x < gCols; x++) {
        const i = row + x;
        let v = grid[i]!;
        if (v === 0) continue;
        if (x > 0) v = Math.min(v, grid[i - 1]! + CHAMFER);
        if (y > 0) v = Math.min(v, grid[up + x]! + CHAMFER);
        grid[i] = v > 255 ? 255 : v;
      }
    }
    for (let y = gRows - 1; y >= 0; y--) {
      const row = y * gCols;
      const down = row + gCols;
      for (let x = gCols - 1; x >= 0; x--) {
        const i = row + x;
        let v = grid[i]!;
        if (v === 0) continue;
        if (x < gCols - 1) v = Math.min(v, grid[i + 1]! + CHAMFER);
        if (y < gRows - 1) v = Math.min(v, grid[down + x]! + CHAMFER);
        grid[i] = v > 255 ? 255 : v;
      }
    }
  }

  /**
   * 0 where the page has text, 1 where it is empty. `y` is relative to the
   * current pass's origin.
   *
   * Before the grid has been built this reports *occupied*, not clear. The guard
   * failing open would put moving hairlines across body copy for the first few
   * hundred milliseconds of every visit, which is precisely the defect this
   * module is under orders not to reintroduce.
   */
  function clear(x: number, y: number, scrolled: number): number {
    if (!gCols) return 0;
    const gx = (x / CELL) | 0;
    const gy = ((y + scrolled) / CELL) | 0;
    if (gx < 0 || gx >= gCols || gy < 0 || gy >= gRows) return 1;
    return grid[gy * gCols + gx]! / 255;
  }

  const measure = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, window.innerWidth);
    h = Math.max(1, window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // The channel is the rail the layout already reserves as body padding. Below
    // the rail breakpoint there is no channel and the stratum does not run —
    // better than crushing it into a gutter it does not fit.
    const rail = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    chanW = rail >= MIN_CHANNEL ? rail : 0;
    chanX = w - rail;

    /* Where the work tape sits in that rail. Measured here and not per frame:
       it is `position: fixed`, so its viewport box only moves when the viewport
       does, and reading a rect inside the loop is exactly what the budget rules
       at the top of this file forbid. */
    logTop = -1;
    logBottom = -1;
    logTextX = 0;
    const log = chanW ? document.querySelector<HTMLElement>('.tape') : null;
    if (log) {
      const r = log.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        logTop = r.top;
        logBottom = r.bottom;
        logTextX = r.left + (parseFloat(getComputedStyle(log).paddingLeft) || 0);
      }
    }

    for (let i = 0; i < S; i++) {
      sx[i] = sxN[i]! * w;
      sy[i] = syN[i]! * h;
    }
  };

  /*
   * Rebuilding the guard walks every text box on a sixteen-thousand-pixel
   * document and reads its rect — one deliberate layout flush. That is fine
   * once; it is not fine on every `resize` event, and dragging a window edge
   * fires dozens per second. The canvas follows the viewport immediately so
   * nothing stretches, and the grid catches up when the drag stops. The stale
   * grid in between only means the guard is briefly measured against the old
   * layout, which shows as a hairline sitting slightly wrong for a moment.
   */
  let gridTimer = 0;
  const scheduleGrid = () => {
    window.clearTimeout(gridTimer);
    gridTimer = window.setTimeout(buildGrid, 180);
  };
  register(() => window.clearTimeout(gridTimer));

  /* ---------- palettes ---------- */

  let inkDay: [number, number, number] = [21, 20, 15];
  let signalDay: [number, number, number] = [176, 52, 26];
  let machineDay: [number, number, number] = [85, 82, 74];
  let inkNight: [number, number, number] = [244, 241, 232];
  let signalNight: [number, number, number] = [226, 103, 63];
  let machineNight: [number, number, number] = [168, 164, 150];

  const readPalette = () => {
    const root = document.documentElement;
    inkDay = readRgb(root, '--field-ink', inkDay);
    signalDay = readRgb(root, '--field-signal', signalDay);
    machineDay = readRgb(root, '--field-machine', machineDay);
    inkNight = readRgb(root, '--field-ink-inv', inkNight);
    signalNight = readRgb(root, '--field-signal-inv', signalNight);
    machineNight = readRgb(root, '--field-machine-inv', machineNight);
  };

  /* ---------- shift state ---------- */

  let night = 0;
  let busy = 0.25;

  const stopShift = onShift((s: ShiftState) => {
    night = s.night;
    busy = busyAt(s.progress);
  });

  /**
   * How hard the machine is working at this point in the read. The shape mirrors
   * the narrative: quiet at the hero, a flood when the messages arrive, steady
   * across the working day, densest at night when it works alone, resolving at
   * the handover.
   */
  function busyAt(p: number): number {
    if (p < 0.06) return 0.18;
    if (p < 0.2) return lerp(0.18, 0.95, (p - 0.06) / 0.14);
    if (p < 0.55) return lerp(0.95, 0.55, (p - 0.2) / 0.35);
    if (p < 0.74) return lerp(0.55, 0.42, (p - 0.55) / 0.19);
    if (p < 0.88) return lerp(0.42, 1, (p - 0.74) / 0.14);
    return lerp(1, 0.3, clamp01((p - 0.88) / 0.12));
  }

  /* ---------- how much machine a section wants behind it ----------
     Declared in markup with data-field-surface="0..1". Seams ask for 1; ordinary
     paper sections say nothing and get the watermark. It raises intensity only —
     it can never open the guard, because no amount of atmosphere justifies a
     moving line behind a sentence. */

  let surface = 0;
  let surfaceTarget = 0;
  const asking = new Map<Element, number>();

  const surfaceIo = new IntersectionObserver(
    (list) => {
      for (const rec of list) {
        if (rec.isIntersecting) {
          asking.set(
            rec.target,
            Number((rec.target as HTMLElement).dataset.fieldSurface ?? '1') || 0,
          );
        } else {
          asking.delete(rec.target);
        }
      }
      let max = 0;
      for (const v of asking.values()) if (v > max) max = v;
      surfaceTarget = clamp01(max);
    },
    { threshold: 0 },
  );
  for (const el of document.querySelectorAll('[data-field-surface]')) surfaceIo.observe(el);
  register(() => surfaceIo.disconnect());

  /* ---------- drawing ---------- */

  let tick = 0; //  virtual stratum offset, px
  let t = 0; //  seconds since start
  let scrolled = 0; //  cached once per frame

  function drawStratum(alpha: number): void {
    if (chanW < MIN_CHANNEL || alpha <= 0.01) return;

    // The channel always sits on paper — the band ground stops at its edge — so
    // the stratum never has to switch inks. It runs hard against the inner edge
    // of the rail, sharing the channel with the work tape.
    const cx = chanX + 7;
    const maxLen = Math.min(34, chanW * 0.22);

    /*
     * Beside the work tape the strip narrows to the gutter.
     *
     * The claim above — two columns side by side — was not true of the geometry.
     * A tick runs up to 39 px from cx, and the tape's text starts 9 px from it, so
     * three ticks in four crossed its timestamps. On a page whose whole argument
     * is a log you can trust, a struck-through timestamp reads as cancelled.
     *
     * It narrows rather than stopping: a gap would say the machine fell silent in
     * exactly the stretch where it is reporting most, and a strip chart squeezed
     * past an annotation is still a strip chart. This is the rule the switchboard
     * already obeys — nothing is drawn over text — applied to the one layer that
     * was exempt from it.
     */
    const squeezed = logTextX > 0 ? Math.max(0, logTextX - 4 - cx) : maxLen;
    const hasLog = logBottom > logTop;
    const logA = logTop - 4;
    const logB = logBottom + 4;

    const first = Math.floor(tick / TICK_GAP) - 1;
    const last = Math.ceil((tick + h) / TICK_GAP) + 1;

    ctx.lineWidth = 1;
    for (let i = first; i <= last; i++) {
      const y = Math.round(i * TICK_GAP - tick) + 0.5;
      if (y < -TICK_GAP || y > h + TICK_GAP) continue;

      const room = hasLog && y > logA && y < logB ? squeezed : maxLen;
      if (room < 2) continue;

      const r1 = hash01(i);
      // Most ticks are ordinary traffic; a few are the owner's own business.
      const isSignal = hash01(i * 7 + 13) > 0.93;
      const len = Math.min(room, 5 + r1 * maxLen);

      // Fade at both ends so the column has no hard edge.
      const a = alpha * (0.22 + r1 * 0.5) * clamp01(Math.min(y, h - y) / (h * 0.16));
      if (a <= 0.01) continue;

      const c = isSignal ? signalDay : machineDay;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + len, y);
      ctx.stroke();

      if (isSignal) {
        ctx.fillStyle = `rgba(${signalDay[0]},${signalDay[1]},${signalDay[2]},${Math.min(1, a * 1.6)})`;
        ctx.fillRect(cx - 3.5, y - 1.5, 3, 3);
      }
    }

    // The reading head: where the machine is writing right now. Same rule — it is
    // the longest mark in the column, so it was the one that crossed furthest.
    const headY = Math.round(h * 0.34) + 0.5;
    const headLen = hasLog && headY > logA && headY < logB ? squeezed : maxLen + 6;
    if (headLen >= 2) {
      ctx.strokeStyle = `rgba(${inkDay[0]},${inkDay[1]},${inkDay[2]},${alpha * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(cx - 4, headY);
      ctx.lineTo(cx + headLen, headY);
      ctx.stroke();
    }
  }

  /** Corner of route `r` — the single turn an orthogonal run is allowed. */
  function cornerX(r: number): number {
    return rHFirst[r] ? sx[rB[r]!]! : sx[rA[r]!]!;
  }
  function cornerY(r: number): number {
    return rHFirst[r] ? sy[rA[r]!]! : sy[rB[r]!]!;
  }

  /** Position at 0..1 along route `r`, written into `out` as [x, y]. */
  const out2 = new Float32Array(2);
  function pointOnRoute(r: number, u: number, out: Float32Array): void {
    const ax = sx[rA[r]!]!;
    const ay = sy[rA[r]!]!;
    const bx = sx[rB[r]!]!;
    const by = sy[rB[r]!]!;
    const cx = cornerX(r);
    const cy = cornerY(r);
    const l1 = Math.abs(cx - ax) + Math.abs(cy - ay);
    const l2 = Math.abs(bx - cx) + Math.abs(by - cy);
    const d = (u < 0 ? 0 : u > 1 ? 1 : u) * (l1 + l2 || 1);
    if (d <= l1) {
      const k = l1 ? d / l1 : 1;
      out[0] = lerp(ax, cx, k);
      out[1] = lerp(ay, cy, k);
    } else {
      const k = l2 ? (d - l1) / l2 : 1;
      out[0] = lerp(cx, bx, k);
      out[1] = lerp(cy, by, k);
    }
  }

  /**
   * Resolve station pixels for a target box, and remember the document offset the
   * guard should be read against. Called immediately before each pass, so the
   * fixed canvas and a band canvas can share one set of buffers.
   */
  let originY = 0;
  function layout(tw: number, th: number, docTop: number): void {
    originY = docTop;
    for (let i = 0; i < S; i++) {
      sx[i] = sxN[i]! * tw;
      sy[i] = syN[i]! * th;
    }
  }

  function drawSwitchboard(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    cInk: [number, number, number],
    cSignal: [number, number, number],
    cMachine: [number, number, number],
  ): void {
    if (alpha <= 0.01) return;

    /* runs */
    ctx.lineWidth = 1;
    for (let r = 0; r < routeCount; r++) {
      const ax = sx[rA[r]!]!;
      const ay = sy[rA[r]!]!;
      const bx = sx[rB[r]!]!;
      const by = sy[rB[r]!]!;
      const cx = cornerX(r);
      const cy = cornerY(r);

      // Each leg is gated on its own midpoint, so a run fades out where it meets
      // a paragraph and comes back on the other side instead of being dropped.
      const g1 = clear((ax + cx) / 2, (ay + cy) / 2, originY);
      const g2 = clear((cx + bx) / 2, (cy + by) / 2, originY);

      if (g1 > 0.02) {
        ctx.strokeStyle = `rgba(${cInk[0]},${cInk[1]},${cInk[2]},${alpha * 0.34 * g1})`;
        ctx.beginPath();
        ctx.moveTo(Math.round(ax) + 0.5, Math.round(ay) + 0.5);
        ctx.lineTo(Math.round(cx) + 0.5, Math.round(cy) + 0.5);
        ctx.stroke();
      }
      if (g2 > 0.02) {
        ctx.strokeStyle = `rgba(${cInk[0]},${cInk[1]},${cInk[2]},${alpha * 0.34 * g2})`;
        ctx.beginPath();
        ctx.moveTo(Math.round(cx) + 0.5, Math.round(cy) + 0.5);
        ctx.lineTo(Math.round(bx) + 0.5, Math.round(by) + 0.5);
        ctx.stroke();
      }
    }

    /* events in transit, each with a short trail — a single 3 px square moving a
       few pixels a frame is invisible, and "something is being carried from one
       place to another" is the entire point of the layer */
    for (let e = 0; e < EVENTS; e++) {
      const r = evRoute[e]!;
      if (r < 0) continue;
      const c = evKind[e] === 1 ? cSignal : cInk;

      for (let j = 0; j < TRAIL; j++) {
        const u = evT[e]! - j * 0.045;
        if (u < 0) break;
        pointOnRoute(r, u, out2);
        const x = out2[0]!;
        const y = out2[1]!;
        const g = clear(x, y, originY);
        if (g <= 0.02) continue;

        const fade = 1 - j / TRAIL;
        const a = alpha * g * (j === 0 ? 0.95 : 0.4 * fade * fade);
        if (a <= 0.015) continue;
        // A square: this is a packet of work, not a spark.
        const s = j === 0 ? 3 : 2;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
        ctx.fillRect(Math.round(x) - s / 2, Math.round(y) - s / 2, s, s);
      }
    }

    /* stations */
    for (let i = 0; i < S; i++) {
      const x = sx[i]!;
      const y = sy[i]!;
      const g = clear(x, y, originY);
      if (g <= 0.02) continue;

      const k = sKind[i]!;
      const owner = k === 4;
      const hit = sHit[i]!;
      const c = owner ? cSignal : k === 2 ? cMachine : cInk;
      const a = alpha * g * ((owner ? 0.9 : 0.38) + hit * 0.5);
      if (a <= 0.01) continue;

      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      if (k === 1) {
        // Projects are squares: a thing with edges and a deadline.
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, owner ? 3 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (owner) {
        // Everything reports here, so the owner is the one station with a ring.
        ctx.strokeStyle = `rgba(${cSignal[0]},${cSignal[1]},${cSignal[2]},${a * 0.42})`;
        ctx.beginPath();
        ctx.arc(x, y, 8.5 + Math.sin(t * 0.9) * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function spawn(dt: number): void {
    if (!routeCount) return;
    // Roughly 0.5 events/s when quiet, 5/s at full tilt.
    if (Math.random() > (0.5 + busy * 4.5) * dt) return;
    for (let e = 0; e < EVENTS; e++) {
      if (evRoute[e]! >= 0) continue;
      evRoute[e] = Math.floor(Math.random() * routeCount);
      evT[e] = 0;
      evSpeed[e] = 0.35 + Math.random() * 0.5;
      evKind[e] = Math.random() > 0.86 ? 1 : 0;
      return;
    }
  }

  /** Advance the simulation. Owned by the fixed canvas, which always exists. */
  function step(dt: number): void {
    t += dt;
    tick += (TICK_SPEED + busy * 46) * dt;
    spawn(dt);
    for (let i = 0; i < S; i++) if (sHit[i]! > 0) sHit[i] = Math.max(0, sHit[i]! - dt * 1.4);
    for (let e = 0; e < EVENTS; e++) {
      const r = evRoute[e]!;
      if (r < 0) continue;
      evT[e] = evT[e]! + evSpeed[e]! * dt;
      if (evT[e]! >= 1) {
        // Arrival registers at the destination: something now knows something.
        sHit[rB[r]!] = 1;
        evRoute[e] = -1;
      }
    }
  }

  function render(dt: number): void {
    scrolled = window.scrollY;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Ease toward whatever the sections in view are asking for, so the machine
    // rises and sinks instead of snapping.
    surface += (surfaceTarget - surface) * Math.min(1, dt * 3.2);

    layout(w, h, scrolled);
    /*
     * The day-to-night arc, made large enough to be an arc.
     *
     * This was `(0.6 + night * 0.4)`, which over ordinary paper moved the field
     * from 0.12 in the morning to 0.20 at midnight — eight hundredths across a
     * whole shift. The page claimed the machine grows more present as the day
     * goes on and then delivered a change the eye cannot find, which is worse
     * than not claiming it.
     *
     * Now the morning is nearly pure paper — 0.06, the machine genuinely out of
     * sight while you are still reading a document — and by night it is 0.21 on
     * paper and saturated on the bands. The claim and the ramp finally agree.
     *
     * Safe against the contrast gate by construction: a paper section is 95 %
     * opaque over this canvas, so everything here reaches the reader attenuated
     * twentyfold, and `npm run contrast` checks the composite at every stop the
     * light can reach rather than taking that on trust.
     */
    drawSwitchboard(
      ctx,
      Math.min(1, lerp(0.14, 0.9, surface) * (0.4 + night * 1.1)),
      inkDay,
      signalDay,
      machineDay,
    );
    drawStratum(0.55 + night * 0.45);

    if (dt > 0) step(dt);
  }

  /* ---------- the dark bands' own canvases ----------
     Each sits inside its section, above a real CSS background and below the type.
     Rendered in the section's own coordinates, so the switchboard scrolls with
     the room instead of sliding behind a window. */

  function mountBand(el: HTMLCanvasElement): void {
    const bctx = el.getContext('2d', { alpha: true });
    if (!bctx) return;
    const host = el.parentElement;
    if (!host) return;

    let bw = 0;
    let bh = 0;
    let bdpr = 1;
    let docTop = 0;

    const size = () => {
      const r = host.getBoundingClientRect();
      bdpr = Math.min(window.devicePixelRatio || 1, 2);
      bw = Math.max(1, Math.round(r.width));
      bh = Math.max(1, Math.round(r.height));
      docTop = r.top + window.scrollY;
      el.width = Math.round(bw * bdpr);
      el.height = Math.round(bh * bdpr);
    };
    size();

    const paint = () => {
      bctx.setTransform(bdpr, 0, 0, bdpr, 0, 0);
      bctx.clearRect(0, 0, bw, bh);
      layout(bw, bh, docTop);
      drawSwitchboard(bctx, 1, inkNight, signalNight, machineNight);
    };

    // Resizing the canvas clears it, so the frozen path has to redraw. The
    // animated path gets there on its next frame anyway.
    const ro = new ResizeObserver(() => {
      size();
      if (staticOnly) paint();
    });
    ro.observe(host);
    register(() => ro.disconnect());

    if (staticOnly) {
      paint();
      el.setAttribute('data-field-static', '');
    } else {
      raf(el, paint, { threshold: 0 });
    }
  }

  /* ---------- run ---------- */

  /*
   * The guard is built off the critical path, never during start-up.
   *
   * Building it walks every text box in the document and reads its rect — one
   * large, deliberate layout flush. Doing that synchronously in init blocked the
   * main thread long enough on a small phone that the intro's timers all fired at
   * once the moment it released, and the entry sequence was simply gone. Until
   * the grid exists `clear()` reports everything as occupied, so the switchboard
   * draws nothing rather than risking a line across a paragraph.
   */
  const idle = (cb: () => void): void => {
    const ric = (window as unknown as { requestIdleCallback?: (fn: () => void) => number })
      .requestIdleCallback;
    // `.call(window)` is not decoration. Pulling requestIdleCallback off window
    // and invoking it bare throws "Illegal invocation" in Chrome, and because
    // that lands inside initField it takes the whole page script down with it —
    // including the `data-ready` flag the entire E2E suite waits on.
    if (ric) ric.call(window, cb);
    else window.setTimeout(cb, 220);
  };

  /*
   * …and not before the intro has finished, either.
   *
   * "Idle" is not enough on its own: the browser is genuinely idle during the
   * entry sequence, so requestIdleCallback fires straight into it, and the grid
   * build is long enough to push the intro's timers late — they then discharge in
   * a burst and the sequence is lost. The intro owns the first couple of seconds
   * of the page; the guard is not needed until someone scrolls, which cannot
   * happen before then. The failsafe in Base.astro guarantees `data-intro-done`
   * appears even if the intro module never loads, so this cannot wait forever.
   */
  const afterIntro = (cb: () => void): void => {
    const root = document.documentElement;
    if (root.hasAttribute('data-intro-done')) {
      idle(cb);
      return;
    }
    const mo = new MutationObserver(() => {
      if (!root.hasAttribute('data-intro-done')) return;
      mo.disconnect();
      idle(cb);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-intro-done'] });
    register(() => mo.disconnect());
  };

  readPalette();
  measure();
  listen(window, 'resize', () => {
    measure();
    readPalette();
    scheduleGrid();
  });

  const mountBands = () => {
    for (const el of document.querySelectorAll<HTMLCanvasElement>('[data-band-field]')) {
      mountBand(el);
    }
  };

  if (staticOnly) {
    // Deterministic: no animation, but still correct at any scroll position.
    surface = surfaceTarget = 0.5;
    t = 3;
    tick = 140;
    for (let e = 0; e < 5; e++) {
      evRoute[e] = (e * 7) % Math.max(1, routeCount);
      evT[e] = 0.3 + e * 0.12;
      evKind[e] = e === 2 ? 1 : 0;
    }
    // The frozen frame has to be drawn *after* the guard exists or it captures
    // an empty field — and the visual baselines are taken from exactly this path.
    const drawStatic = () => render(0);
    afterIntro(() => {
      buildGrid();
      drawStatic();
      mountBands();
      canvas.setAttribute('data-field-static', '');
      canvas.setAttribute('data-field-ready', '');
    });
    listen(window, 'scroll', drawStatic, { passive: true });
  } else {
    afterIntro(() => buildGrid());
    raf(canvas, (_now, dt) => render(dt));
    mountBands();
    canvas.setAttribute('data-field-ready', '');
  }

  // Text boxes move once more when the webfonts land, and nothing after that
  // changes layout, so this is the last chance for the grid to go stale. Routed
  // through idle for the same reason as the first build.
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() =>
      afterIntro(() => {
        measure();
        buildGrid();
      }),
    );
  }

  return register(() => stopShift());
}
