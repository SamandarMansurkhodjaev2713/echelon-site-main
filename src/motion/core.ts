/*
 * THE VOICE CORE.
 *
 * History, because it matters for the decisions here: the baseline shipped a
 * 460-point glowing canvas sphere. The redesign deleted it as "the exact glowing
 * AI orb the art direction rules out" and replaced it with a flat tape trace.
 * That was right about the orb and wrong about the section: it left the strongest
 * claim on the page — the one where the product stops being compared to Jarvis
 * and just talks — as a text link and three empty rules.
 *
 * So the core comes back, but it has to earn the space rather than glow in it:
 *
 *   IT IS DRAWN, NOT LIT. Hairline latitude rings and a point lattice, in the
 *     journal's own inks. No bloom, no gradient halo, no additive blending. It
 *     belongs to the same hand that drew the switchboard and the rules on the
 *     paper, which is what keeps it from looking imported from another site.
 *
 *   IT IS AUDIO-TRUTHFUL. The deformation is driven by a real FFT of whatever is
 *     actually playing — the recording, or the live session when one is running.
 *     Each point's radius answers to the frequency band at its own latitude, so
 *     the shape genuinely is the sound and cannot be faked by a sine wave.
 *
 *   IT SHOWS THE MEMORY. A handful of points are named: the same entities the
 *     transcript marks as things it knew before this conversation started. They
 *     are labelled where they sit on the sphere. The labels are a fixed property
 *     of those points, never timed to the audio — implying it had just said a
 *     name would be a claim this module cannot actually support.
 *
 * Budget: every buffer is allocated once, nothing is sorted per frame (depth is
 * handled by two ordered passes, back hemisphere then front), and the whole loop
 * is gated by raf() on visibility. Reduced motion draws one still frame.
 */

import { raf, register } from './lifecycle';
import { prefersReducedMotion, isCompact, motionFrozen } from './media';

export type CorePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

/** How many frequency bands the core resolves across its latitudes. */
export const CORE_BANDS = 24;

export interface CoreDriver {
  /** overall amplitude, 0..1 */
  level(): number;
  /** fill `out` (length CORE_BANDS) with 0..1 energies, low → high */
  spectrum(out: Float32Array): void;
  phase(): CorePhase;
}

export interface CoreEntity {
  /** the name as the transcript marks it */
  label: string;
  /** what kind of thing it is, shown under the label */
  kind: string;
}

const POINTS_WIDE = 560;
const POINTS_COMPACT = 240;
/** Points per latitude ring polyline. */
const RING_STEPS = 72;
/*
 * One, and it is the equator.
 *
 * Five parallel latitudes at a shallow tilt stack into contour lines and the eye
 * files the object under "globe diagram", however hard the lattice between them
 * is working. Cutting to three did not fix that — three read as three plates.
 *
 * The rings turned out not to be needed at all: since the outer contour started
 * following the spectrum it does the work of structure better than any fixed
 * horizontal can, because it is alive. What is left is a single equator, which
 * gives the body an axis and a sense of which way it is turning without
 * proposing that it is a diagram of anything.
 */
const RINGS = [0];

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function readRgb(el: Element, prop: string, fallback: [number, number, number]) {
  const raw = getComputedStyle(el).getPropertyValue(prop).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (m) {
    const n = parseInt(m[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
  }
  return fallback;
}

/*
 * The one piece of type on this page that no gate could see.
 *
 * `scripts/contrast.mjs` validates every colour in the palette and axe-core
 * checks every rendered element, and neither of them can reach a string painted
 * into a canvas at a computed alpha. The entity names were carried by the same
 * `fade` as the dots and the rings — which drops to 0.45 whenever nothing is
 * playing, and nothing is playing until the visitor presses play. Measured
 * against every ground the ambient ramp can reach, that put the name at 2.7:1
 * and the kind beneath it at 1.7:1, where AA asks for 4.5. The kind label did
 * not clear AA in *any* state, including mid-sentence at full brightness.
 *
 * So the type no longer shares the ornament's alpha. These two floors are the
 * minimum that clears AA on the darkest ground, taken from the CORE LABELS block
 * in scripts/contrast.mjs, which now gates them the way it gates the ramp.
 *
 * Losing the `open` term here is a gain, not a compromise: the comment below
 * insists these labels are never timed to the audio, and brightening them when
 * the voice starts was the one place that claim leaked.
 */
const LABEL_ALPHA = 0.72; //  ink — needs ≥ 0.615
const KIND_ALPHA = 0.92; //  machine — needs ≥ 0.895

export function initCore(
  canvas: HTMLCanvasElement,
  driver: CoreDriver,
  entities: readonly CoreEntity[],
): () => void {
  const base = canvas.getContext('2d', { alpha: true });
  if (!base) return () => {};
  const ctx: CanvasRenderingContext2D = base;

  const reduced = prefersReducedMotion() || motionFrozen();
  const P = isCompact() ? POINTS_COMPACT : POINTS_WIDE;

  /* ---------- the lattice, allocated once ---------- */

  const ux = new Float32Array(P); //  unit sphere
  const uy = new Float32Array(P);
  const uz = new Float32Array(P);
  const band = new Uint8Array(P); //  which frequency band this point answers to

  // Fibonacci lattice: the only even distribution on a sphere that needs no
  // relaxation pass, which matters because this is computed at start-up.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < P; i++) {
    const y = 1 - (i / (P - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * golden;
    ux[i] = Math.cos(th) * r;
    uy[i] = y;
    uz[i] = Math.sin(th) * r;
    // Latitude → band. Low frequencies at the equator, where the sphere is
    // widest, so the loudest part of speech moves the most surface.
    band[i] = Math.min(CORE_BANDS - 1, Math.round(Math.abs(y) * (CORE_BANDS - 1)));
  }

  // Entity anchors. Spread over longitude *and* latitude: placing them all near
  // the equator put two labels on the same baseline the moment the sphere turned,
  // and overlapping type is worse than no label at all.
  /* None of them within reach of the equator: with a single ring left, a name
     anchored near latitude zero has the ring drawn straight through its own
     letters. Keeping the anchors clear of that band solves it by construction,
     which is better than nudging a label away from a line at draw time and
     hoping the two never meet again. */
  const LATS = [0.34, -0.22, 0.52, -0.42, 0.24, -0.34];
  const eIndex = new Uint16Array(entities.length);
  for (let k = 0; k < entities.length; k++) {
    const wantTh = ((k + 0.5) / entities.length) * Math.PI * 2;
    const wantY = LATS[k % LATS.length]!;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < P; i++) {
      const th = Math.atan2(uz[i]!, ux[i]!);
      const dth = Math.abs(Math.atan2(Math.sin(th - wantTh), Math.cos(th - wantTh)));
      const dy = Math.abs(uy[i]! - wantY);
      const d = dth + dy * 2.4;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    eIndex[k] = best;
  }

  const spec = new Float32Array(CORE_BANDS);
  const specSmooth = new Float32Array(CORE_BANDS);

  /* ---------- surface ---------- */

  let dpr = 1;
  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let radius = 0;

  const measure = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cx = w / 2;
    cy = h / 2;
    // Bounded by height, not by the smaller side: the canvas is wider than it is
    // tall, and the spare width is exactly the room the entity labels need.
    radius = Math.min(h * 0.42, w * 0.3);
  };
  measure();

  const ro = new ResizeObserver(measure);
  ro.observe(canvas);
  register(() => ro.disconnect());

  let ink: [number, number, number] = [21, 20, 15];
  let signal: [number, number, number] = [176, 52, 26];
  let machine: [number, number, number] = [85, 82, 74];
  /* The ground the core is drawn on, so a name can be haloed out of it. Read
     rather than assumed, because the ambient light moves the paper through the
     day and a halo mixed from yesterday's value would ring faintly at dusk. */
  let paper: [number, number, number] = [247, 243, 231];
  const readPalette = () => {
    ink = readRgb(canvas, '--ink', ink);
    signal = readRgb(canvas, '--signal', signal);
    machine = readRgb(canvas, '--machine', machine);
    paper = readRgb(canvas, '--paper', paper);
  };
  readPalette();

  /* ---------- state ---------- */

  let t = 0;
  let level = 0;
  let open = 0; //  0 at rest, 1 fully awake — the core opens when it has work
  let phase: CorePhase = 'idle';

  const labelFont = `600 11px ${getComputedStyle(canvas).getPropertyValue('--font-system') || 'monospace'}`;

  function project(
    x: number,
    y: number,
    z: number,
    ca: number,
    sa: number,
    ct: number,
    st: number,
    out: Float32Array,
  ): void {
    // spin about Y, then a fixed tilt about X
    const rx = x * ca + z * sa;
    const rz0 = -x * sa + z * ca;
    const ry = y * ct - rz0 * st;
    const rz = y * st + rz0 * ct;
    out[0] = cx + rx * radius;
    out[1] = cy + ry * radius;
    out[2] = rz; //  −1 back … +1 front
  }

  const p3 = new Float32Array(3);

  function drawRings(ca: number, sa: number, ct: number, st: number, alpha: number): void {
    ctx.lineWidth = 1;
    for (const lat of RINGS) {
      /*
       * The ring answers to the band at its own latitude, by the same formula as
       * the points there — and it has to be the *same* formula, because if the
       * rings deform on a different curve from the lattice they slide against it
       * and the surface stops reading as one object.
       *
       * This is what was missing, and it is why a core that was genuinely
       * answering to the audio still read as a static wireframe globe. The
       * displacement was reaching only the points: 1 px squares at low alpha.
       * The five rings — the structure the eye actually locks onto — were drawn
       * from fixed geometry and never moved at all, so they said "diagram" loudly
       * enough to drown out everything the points were saying.
       */
      const b = Math.min(CORE_BANDS - 1, Math.round(Math.abs(lat) * (CORE_BANDS - 1)));
      const disp = 1 + (spec[b] ?? 0) * (0.12 + open * 0.3) + level * 0.06;
      // Radial: the latitude rides outward with its own circle, so the ring stays
      // on the deformed sphere rather than cutting through it.
      const rr = Math.sqrt(Math.max(0, 1 - lat * lat)) * disp;
      const ly = lat * disp;
      // Back half first, then front, so the ring reads as passing behind itself.
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        let drawing = false;
        for (let s = 0; s <= RING_STEPS; s++) {
          const th = (s / RING_STEPS) * Math.PI * 2;
          project(Math.cos(th) * rr, ly, Math.sin(th) * rr, ca, sa, ct, st, p3);
          const front = p3[2]! >= 0;
          if (front !== (pass === 1)) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            ctx.moveTo(p3[0]!, p3[1]!);
            drawing = true;
          } else {
            ctx.lineTo(p3[0]!, p3[1]!);
          }
        }
        ctx.strokeStyle = `rgba(${machine[0]},${machine[1]},${machine[2]},${
          alpha * (pass === 1 ? 0.78 : 0.22)
        })`;
        ctx.stroke();
      }
    }
  }

  function render(dt: number): void {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    phase = driver.phase();
    const active = phase !== 'idle';
    const raw = clamp01(driver.level());
    // Fast attack, slow release — the shape has to arrive with the syllable, and
    // a symmetric filter makes speech look like a slow pulse instead.
    level += (raw - level) * (raw > level ? 0.5 : 0.12);
    open += ((active ? 1 : 0) - open) * Math.min(1, dt * 2.4);

    driver.spectrum(spec);
    for (let b = 0; b < CORE_BANDS; b++) {
      const v = spec[b] ?? 0;
      specSmooth[b] = specSmooth[b]! + (v - specSmooth[b]!) * (v > specSmooth[b]! ? 0.55 : 0.16);
    }
    // Blur across neighbouring bands as well as across time. Without it each
    // latitude moves independently and the sphere sprays apart into noise; with
    // it the whole surface deforms as a surface, which is what a voice does to
    // one.
    for (let b = 0; b < CORE_BANDS; b++) {
      const lo = specSmooth[b === 0 ? 0 : b - 1]!;
      const hi = specSmooth[b === CORE_BANDS - 1 ? b : b + 1]!;
      spec[b] = (lo + specSmooth[b]! * 2 + hi) / 4;
    }

    // Spin is slow at rest and only a little faster when it is talking: a core
    // that whirls when it speaks reads as a loading spinner.
    const angle = t * (0.16 + open * 0.1);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const tilt = -0.28;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);

    const structure = 0.35 + open * 0.45;
    drawRings(ca, sa, ct, st, structure);

    // Points, back hemisphere then front. Two ordered passes instead of a sort:
    // the baseline's sphere sorted 460 elements every frame and it is exactly the
    // kind of per-frame work this rebuild is not allowed to reintroduce.
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < P; i++) {
        const disp = 1 + spec[band[i]!]! * (0.12 + open * 0.3) + level * 0.06;
        project(ux[i]! * disp, uy[i]! * disp, uz[i]! * disp, ca, sa, ct, st, p3);
        const front = p3[2]! >= 0;
        if (front !== (pass === 1)) continue;

        const depth = (p3[2]! + 1) / 2;
        const a = (0.14 + depth * 0.66) * (0.5 + open * 0.5);
        if (a <= 0.015) continue;
        ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${a})`;
        const r = 0.55 + depth * 1.05;
        ctx.fillRect(p3[0]! - r, p3[1]! - r, r * 2, r * 2);
      }
    }

    /* The owner's attention: a ring that tightens while it listens. */
    if (open > 0.01) {
      const listening = phase === 'listening';
      /* Tight enough that the loudest excursion still fits the canvas. The ring
         sits at up to `base * 1.16`, and at the previous 1.24 that put the peaks
         past the top and bottom edges, where they were sliced flat — a clipped
         waveform is a lie about the sound. It also reads better close in: a
         contour around the body, not a distant orbit. */
      const base = radius * (listening ? 1.06 - level * 0.08 : 1.12 + level * 0.05);

      /*
       * Not a circle any more.
       *
       * This was the largest and cleanest mark on the core, and it was the one
       * doing the most damage: a perfect outline states "diagram" far more
       * loudly than a deforming lattice inside it states "voice". Every other
       * element could answer to the audio and the eye would still land on the
       * circle and file the whole object under figure.
       *
       * Its radius now follows the spectrum around the circumference, so the
       * outermost thing on the object *is* the shape of the sound. Mirrored
       * across both axes on purpose: an outline that varies freely reads as a
       * wobble, one that is symmetric reads as a voice. And when nothing is
       * playing the spectrum is flat and it relaxes back into exactly the circle
       * it always was — the honest resting state, not a fake idle animation.
       */
      const STEPS = 180;
      ctx.beginPath();
      for (let s = 0; s <= STEPS; s++) {
        const a = (s / STEPS) * Math.PI * 2;
        // 0 at the poles, 1 at the widest point — low bands move the most surface
        const u = Math.abs(Math.cos(a));
        const b = Math.min(CORE_BANDS - 1, Math.round((1 - u) * (CORE_BANDS - 1)));
        const rr = base * (1 + (spec[b] ?? 0) * (0.05 + open * 0.16));
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${signal[0]},${signal[1]},${signal[2]},${
        open * (listening ? 0.55 : 0.24)
      })`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Named memory. These labels are a fixed property of their points — they are
       never triggered by the audio, because nothing here knows what word is being
       said, and pretending otherwise would be the one dishonest thing on a page
       whose whole argument is that it does not overclaim. */
    ctx.font = labelFont;
    ctx.textBaseline = 'middle';
    for (let k = 0; k < entities.length; k++) {
      const i = eIndex[k]!;
      project(ux[i]!, uy[i]!, uz[i]!, ca, sa, ct, st, p3);
      if (p3[2]! < 0.08) continue; //  only when facing the reader
      /* `depth` is the spatial cue and is all the type answers to: a name still
         fades as its point turns away from the reader, and is at full strength
         while it faces them. `fade` keeps the resting dimness, and now carries
         only the leader line and the anchor dot — ornament, where being quiet at
         rest is the intended reading. */
      const depth = clamp01((p3[2]! - 0.08) / 0.35);
      if (depth <= 0.02) continue;
      const fade = depth * (0.45 + open * 0.55);

      const dirX = p3[0]! >= cx ? 1 : -1;
      const lx = p3[0]! + dirX * 14;
      const ly = p3[1]!;

      ctx.strokeStyle = `rgba(${signal[0]},${signal[1]},${signal[2]},${fade * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p3[0]! + dirX * 4, ly + 0.5);
      ctx.lineTo(lx, ly + 0.5);
      ctx.stroke();

      ctx.fillStyle = `rgba(${signal[0]},${signal[1]},${signal[2]},${fade})`;
      ctx.beginPath();
      ctx.arc(p3[0]!, p3[1]!, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = dirX > 0 ? 'left' : 'right';

      /*
       * A halo of the ground, drawn under the name.
       *
       * Separating the anchors by latitude did not stop the equator being drawn
       * through the middle of a word, and could not: the ring projects as an
       * ellipse occupying a wide band of the canvas, so any label inside that
       * band meets the line wherever it is anchored. Haloing the text is what a
       * map does for exactly this reason, and it holds against the lattice and
       * the spectrum contour too, not only against the ring it was noticed on.
       */
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(${paper[0]},${paper[1]},${paper[2]},${depth * 0.9})`;
      ctx.strokeText(entities[k]!.label, lx + dirX * 4, ly - 5);
      ctx.strokeText(entities[k]!.kind, lx + dirX * 4, ly + 7);

      ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${depth * LABEL_ALPHA})`;
      ctx.fillText(entities[k]!.label, lx + dirX * 4, ly - 5);
      ctx.fillStyle = `rgba(${machine[0]},${machine[1]},${machine[2]},${depth * KIND_ALPHA})`;
      ctx.fillText(entities[k]!.kind, lx + dirX * 4, ly + 7);
    }

    if (dt > 0) t += dt;
  }

  if (reduced) {
    // One still frame. The core is legible as an object; it simply does not turn.
    t = 1.6;
    render(0);
    canvas.setAttribute('data-core-static', '');
    /* The repaint below exists on the animated path so the labels are not set in
       whatever face was loaded at start-up. This path has no next frame to
       correct itself on, so without it the one frame it ever draws keeps the
       fallback — and reduced motion is a reader's preference, not only a test
       mode, so that is a person reading the names in the wrong type. */
    if (document.fonts?.ready) void document.fonts.ready.then(() => render(0));
    // Amplitude still matters when the recording is playing, so redraw on demand.
    return register(() => {});
  }

  raf(canvas, (_now, dt) => render(dt), { threshold: 0.01 });
  // Repaint once when the fonts land so the labels are not measured too early.
  if (document.fonts?.ready) void document.fonts.ready.then(() => render(0));

  return register(() => {});
}
