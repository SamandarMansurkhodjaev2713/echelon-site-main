/*
 * ConstellationSphere — the product's own voice sphere, on the page.
 *
 * This is a faithful vanilla port of
 * `hermes/web/src/features/voice/spheres/ConstellationSphere.tsx`: a gold neuron
 * sphere with water physics, phased idle → listening → thinking → speaking. It
 * shipped in `ddae5ab`, was deleted in `820a7a2` as "the exact glowing AI orb the
 * art direction rules out", and is back because that judgement was wrong about
 * this object in particular. It is not a decorative orb borrowed from some other
 * landing page — it is a component of the product, and the owner recognises it as
 * one. A site whose whole argument is "this is the real thing, not a picture of
 * it" cannot redraw the one piece of the real thing it shows.
 *
 * Geometry, physics and colour are the product's, unchanged: 460 points on a
 * Fibonacci sphere, links between neighbours inside 0.27, displacement driven by
 * two travelling wave fields plus pointer ripples, gold that runs to white at the
 * peaks.
 *
 * WHAT IS NOT THE PRODUCT'S is how the paint reaches the canvas. The original
 * builds an `rgba()` string per link and per point, every frame — with ~1 300
 * links that is some 1 800 allocations a frame, and PHASE 17 removed exactly this
 * pattern from motion/field.ts after measuring what it cost there (p95 33.3 ms →
 * 16.8 ms for 380 of them). Batching the strokes into one path would fix it and
 * would also change the picture: under `lighter`, separate strokes accumulate
 * where links cross and a single path does not, and that accumulation is most of
 * why the lattice reads as a mesh rather than a wireframe. So the fix is a
 * per-frame palette instead: the depth term is quantised into a fixed number of
 * steps, the strings for those steps are built once per frame, and every link and
 * point is still stroked and filled individually against them. Same compositing,
 * same picture, ~40 allocations a frame instead of ~1 800.
 */

import { raf, register } from '../motion/lifecycle';
import { prefersReducedMotion, motionFrozen, hasFinePointer } from '../motion/media';

export type SpherePhase = 'idle' | 'listening' | 'thinking' | 'tool' | 'speaking';

export interface SphereSource {
  /** overall amplitude, 0..1 */
  level(): number;
  phase(): SpherePhase;
}

/* — the product's constants, unchanged — */
const N = 460;
const NEIGH_DIST = 0.27;
const FOCAL = 3.4;
const MAX_DISP = 0.42;
const SMOOTH = 0.16;
const TILT = 0.42;

/** Depth quantisation for the per-frame palette. 24 steps across the sphere's
    front-to-back range is finer than the eye resolves in a 1 px hairline, and
    was checked against the unquantised original at 1440 and at 390. */
const STEPS = 24;

const PHASE_TUNING: Record<SpherePhase, { spin: number; energy: number }> = {
  idle: { spin: 0.05, energy: 0.22 },
  listening: { spin: 0.12, energy: 0.7 },
  thinking: { spin: 0.45, energy: 0.85 },
  tool: { spin: 0.45, energy: 0.85 },
  speaking: { spin: 0.2, energy: 1.0 },
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function fibonacciSphere(n: number): Float32Array {
  const pts = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts[i * 3] = Math.cos(theta) * r;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = Math.sin(theta) * r;
  }
  return pts;
}

/** The warm medallion the gold sits on — the product's own stage. */
export const SPHERE_STAGE =
  'radial-gradient(circle at 50% 42%, #261a0b 0%, #15100a 58%, #0c0805 100%)';

export function initSphere(canvas: HTMLCanvasElement, source: SphereSource): () => void {
  /* Narrowed into a const: `draw` is a closure, and TypeScript drops the
     null-check across that boundary. */
  const raw2d = canvas.getContext('2d', { alpha: true });
  if (!raw2d) return () => {};
  const ctx: CanvasRenderingContext2D = raw2d;

  const still = prefersReducedMotion() || motionFrozen();

  const base = fibonacciSphere(N);

  /* Links, found once. The pass is O(n²) on 460 points — 105 k comparisons, a
     fraction of a millisecond, and it never runs again. */
  const pairA: number[] = [];
  const pairB: number[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = base[i * 3]! - base[j * 3]!;
      const dy = base[i * 3 + 1]! - base[j * 3 + 1]!;
      const dz = base[i * 3 + 2]! - base[j * 3 + 2]!;
      if (dx * dx + dy * dy + dz * dz < NEIGH_DIST * NEIGH_DIST) {
        pairA.push(i);
        pairB.push(j);
      }
    }
  }
  const links = pairA.length;

  const projX = new Float32Array(N);
  const projY = new Float32Array(N);
  const projScale = new Float32Array(N);
  const projFront = new Float32Array(N);
  const prevX = new Float32Array(N);
  const prevY = new Float32Array(N);
  const disp = new Float32Array(N);
  /* Painter's order, sorted back-to-front each frame by insertion sort: the
     order barely changes between frames, which is the case insertion sort is
     good at and Array#sort is not. */
  const order = new Int16Array(N);
  for (let i = 0; i < N; i++) order[i] = i;

  const linkPalette: string[] = new Array(STEPS);
  const dotPalette: string[] = new Array(STEPS * 4);

  let dims = { w: 0, h: 0, dpr: 1 };
  const parent = canvas.parentElement ?? canvas;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w === 0 || h === 0) return;
    dims = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(parent);

  /* ---------- pointer ripples ----------
     The product calls this water physics and it is the sphere's one piece of
     direct interaction: the surface answers the hand. Only on a real pointer —
     on a touch screen the same listener fires while the visitor is trying to
     scroll past the section, so the sphere would ripple at someone who was
     leaving. */
  const ripX = new Float32Array(3);
  const ripY = new Float32Array(3);
  const ripBorn = new Float32Array(3);
  let ripCount = 0;
  let lastSpawn = 0;

  const spawn = (e: PointerEvent, strong: boolean) => {
    const now = performance.now();
    if (!strong && now - lastSpawn < 110) return;
    lastSpawn = now;
    const r = canvas.getBoundingClientRect();
    const slot = ripCount % 3;
    ripX[slot] = e.clientX - r.left;
    ripY[slot] = e.clientY - r.top;
    ripBorn[slot] = now;
    ripCount++;
  };
  const onMove = (e: PointerEvent) => spawn(e, false);
  const onDown = (e: PointerEvent) => spawn(e, true);
  const interactive = hasFinePointer() && !still;
  if (interactive) {
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
  }

  let spinT = 0;
  let waveT = 0;
  let levelSmoothed = 0;
  const tuning = { ...PHASE_TUNING.idle };

  const readLevel = () => {
    const raw = clamp01(Math.pow(clamp01(source.level() * 2.4), 0.75));
    levelSmoothed =
      raw > levelSmoothed ? lerp(levelSmoothed, raw, 0.55) : lerp(levelSmoothed, raw, 0.1);
    return levelSmoothed;
  };

  function draw(now: number, dt: number) {
    const { w, h, dpr } = dims;
    if (w === 0 || h === 0) return;

    const phase = source.phase();
    const target = PHASE_TUNING[phase] ?? PHASE_TUNING.idle;
    const k = 1 - Math.exp(-dt * 4);
    tuning.spin = lerp(tuning.spin, target.spin, k);
    tuning.energy = lerp(tuning.energy, target.energy, k);

    const level = readLevel();
    const process = phase === 'thinking' || phase === 'tool';
    spinT += dt * (0.03 + level * 0.015);
    waveT += dt * (0.7 + tuning.spin * 0.35 + level * 0.4);

    const waveAmp = process
      ? 0.09 + 0.07 * (0.5 + 0.5 * Math.sin(waveT * 1.25)) + level * 0.09
      : 0.045 + level * 0.34;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.33;

    const cosY = Math.cos(spinT);
    const sinY = Math.sin(spinT);
    const cosX = Math.cos(TILT);
    const sinX = Math.sin(TILT);

    for (let i = 0; i < N; i++) {
      const bx = base[i * 3]!;
      const by = base[i * 3 + 1]!;
      const bz = base[i * 3 + 2]!;
      const slow =
        (Math.sin(3.0 * by + waveT * 0.9) +
          Math.sin(3.3 * bx - waveT * 0.7) +
          Math.sin(2.7 * bz + waveT * 1.1)) /
        3;
      const fast =
        (Math.sin(5.2 * by - waveT * 2.0) + Math.sin(4.8 * (bx + bz) + waveT * 1.6)) / 2;
      let field = slow * 0.6 + fast * 0.4;
      if (process) field = field * 0.4 + 0.85 * Math.sin(by * 4 - waveT * 1.7);
      let t = waveAmp * field;

      for (let r = 0; r < 3; r++) {
        if (ripBorn[r] === 0) continue;
        const dpx = prevX[i]! - ripX[r]!;
        const dpy = prevY[i]! - ripY[r]!;
        const d = Math.sqrt(dpx * dpx + dpy * dpy) / R;
        const age = (now - ripBorn[r]!) / 1000;
        if (age > 3) continue;
        t += 0.06 * Math.exp(-age * 1.8) * Math.exp(-d * 1.4) * Math.sin(d * 6 - age * 5);
      }

      if (t > MAX_DISP) t = MAX_DISP;
      else if (t < -MAX_DISP) t = -MAX_DISP;
      disp[i]! += (t - disp[i]!) * SMOOTH;

      const s = 1 + disp[i]!;
      const x = bx * s;
      const y = by * s;
      const z = bz * s;
      const x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      z1 = y * sinX + z1 * cosX;
      const persp = FOCAL / (FOCAL - z1);
      const px = cx + x1 * R * persp;
      const py = cy + y1 * R * persp;
      projX[i] = px;
      projY[i] = py;
      projScale[i] = persp;
      projFront[i] = (z1 + 1) / 2;
      prevX[i] = px;
      prevY[i] = py;
    }

    ctx.globalCompositeOperation = 'lighter';

    /* --- the palettes for this frame --- */
    const lineEnergy = 0.09 + tuning.energy * 0.2 + level * 0.5;
    for (let s = 0; s < STEPS; s++) {
      const front = (s + 0.5) / STEPS;
      const g = Math.round(150 + front * 95);
      const b = Math.round(45 + front * 55 + level * 35);
      linkPalette[s] = `rgb(255, ${g}, ${b})`;
    }
    for (let s = 0; s < STEPS; s++) {
      const front = (s + 0.5) / STEPS;
      for (let p = 0; p < 4; p++) {
        const peak = (p / 3) * MAX_DISP;
        const g = Math.min(255, Math.round(155 + front * 80 + peak * 120));
        const b = Math.min(255, Math.round(45 + front * 120 + level * 45 + peak * 200));
        dotPalette[s * 4 + p] = `rgb(255, ${g}, ${b})`;
      }
    }

    /* --- links --- */
    ctx.lineWidth = 1 + level * 0.6;
    for (let k2 = 0; k2 < links; k2++) {
      const a = pairA[k2]!;
      const b = pairB[k2]!;
      const front = (projFront[a]! + projFront[b]!) / 2;
      const alpha = front * front * lineEnergy;
      if (alpha < 0.012) continue;
      let step = (front * STEPS) | 0;
      if (step >= STEPS) step = STEPS - 1;
      else if (step < 0) step = 0;
      ctx.strokeStyle = linkPalette[step]!;
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.beginPath();
      ctx.moveTo(projX[a]!, projY[a]!);
      ctx.lineTo(projX[b]!, projY[b]!);
      ctx.stroke();
    }

    /* --- points, back to front --- */
    for (let i = 1; i < N; i++) {
      const v = order[i]!;
      const key = projFront[v]!;
      let j = i - 1;
      while (j >= 0 && projFront[order[j]!]! > key) {
        order[j + 1] = order[j]!;
        j--;
      }
      order[j + 1] = v;
    }

    for (let i = 0; i < N; i++) {
      const idx = order[i]!;
      const front = projFront[idx]!;
      const sc = projScale[idx]!;
      const peak = disp[idx]! > 0 ? disp[idx]! : 0;
      const size = (0.7 + front * 1.9) * sc * (1 + level * 0.8 + peak * 2.5);
      const a = 0.24 + front * 0.66 + level * 0.18 + peak * 1.0;
      let step = (front * STEPS) | 0;
      if (step >= STEPS) step = STEPS - 1;
      else if (step < 0) step = 0;
      let pk = ((peak / MAX_DISP) * 3 + 0.5) | 0;
      if (pk > 3) pk = 3;
      else if (pk < 0) pk = 0;
      ctx.fillStyle = dotPalette[step * 4 + pk]!;
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.beginPath();
      ctx.arc(projX[idx]!, projY[idx]!, size, 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- the core's own light --- */
    ctx.globalAlpha = 1;
    const glowR = R * (0.55 + level * 0.65);
    const coreA = 0.14 + level * 0.5 + tuning.energy * 0.1;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, glowR));
    grad.addColorStop(0, `rgba(255, 245, 220, ${coreA})`);
    grad.addColorStop(0.42, `rgba(255, 174, 60, ${coreA * 0.5})`);
    grad.addColorStop(1, 'rgba(255, 122, 24, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
  }

  let stopLoop = () => {};
  if (still) {
    /* One deterministic frame. `waveT` is advanced to a fixed, non-zero point so
       the still picture is a sphere caught mid-breath rather than a perfectly
       undeformed ball, which is what the sphere never actually looks like. */
    waveT = 1.4;
    spinT = 0.6;
    const settle = () => {
      /* the displacement filter needs a few passes to reach the shape its inputs
         imply; without them the frozen frame is a smooth ball */
      for (let i = 0; i < 24; i++) draw(0, 1 / 60);
    };
    settle();
    const onResize = () => settle();
    window.addEventListener('resize', onResize);
    stopLoop = () => window.removeEventListener('resize', onResize);
    /* Fonts and layout settle after first paint; redraw once they have. */
    void document.fonts?.ready.then(settle).catch(() => {});
  } else {
    stopLoop = raf(canvas, (now, dt) => draw(now, dt || 1 / 60), { threshold: 0.02 });
  }

  return register(() => {
    stopLoop();
    ro.disconnect();
    if (interactive) {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    }
  });
}
