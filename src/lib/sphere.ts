/*
 * ConstellationSphere — faithful vanilla port of the product's voice sphere
 * (hermes/web/src/features/voice/spheres/ConstellationSphere.tsx).
 * Gold neuron sphere with water physics; phases idle/listening/thinking/speaking.
 */

export type SpherePhase = 'idle' | 'listening' | 'thinking' | 'tool' | 'speaking';

const N = 460;
const NEIGH_DIST = 0.27;
const FOCAL = 3.4;
const MAX_DISP = 0.42;
const SMOOTH = 0.16;

const PHASE_TUNING: Record<SpherePhase, { spin: number; energy: number }> = {
  idle: { spin: 0.05, energy: 0.22 },
  listening: { spin: 0.12, energy: 0.7 },
  thinking: { spin: 0.45, energy: 0.85 },
  tool: { spin: 0.45, energy: 0.85 },
  speaking: { spin: 0.2, energy: 1.0 },
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function fibonacciSphere(n: number): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
}

interface Ripple {
  sx: number;
  sy: number;
  born: number;
}

export class ConstellationSphere {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base = fibonacciSphere(N);
  private pairs: Array<[number, number]> = [];
  private ripples: Ripple[] = [];
  private lastSpawn = 0;
  private raf = 0;
  private spinT = 0;
  private waveT = 0;
  private last = performance.now();
  private proj = new Float32Array(N * 4);
  private prev = new Float32Array(N * 2);
  private dispCur = new Float32Array(N);
  private dims = { w: 0, h: 0, dpr: 1 };
  private obs: ResizeObserver;
  private reduced: boolean;
  private phase: SpherePhase = 'idle';
  private tuning = { ...PHASE_TUNING.idle };
  private getLevel: () => number = () => 0;
  private levelSmoothed = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = this.base[i]![0] - this.base[j]![0];
        const dy = this.base[i]![1] - this.base[j]![1];
        const dz = this.base[i]![2] - this.base[j]![2];
        if (dx * dx + dy * dy + dz * dz < NEIGH_DIST * NEIGH_DIST) this.pairs.push([i, j]);
      }
    }

    this.reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const parent = canvas.parentElement ?? canvas;
    const apply = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      this.dims = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    apply();
    this.obs = new ResizeObserver(apply);
    this.obs.observe(parent);

    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerdown', this.onDown);
  }

  private onMove = (e: PointerEvent) => this.spawn(e, false);
  private onDown = (e: PointerEvent) => this.spawn(e, true);

  private spawn(e: PointerEvent, strong: boolean) {
    const r = this.canvas.getBoundingClientRect();
    const now = performance.now();
    if (!strong && now - this.lastSpawn < 110) return;
    this.lastSpawn = now;
    this.ripples.push({ sx: e.clientX - r.left, sy: e.clientY - r.top, born: now });
    if (this.ripples.length > 3) this.ripples.shift();
  }

  setPhase(p: SpherePhase) {
    this.phase = p;
  }

  setLevelSource(fn: () => number) {
    this.getLevel = fn;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.obs.disconnect();
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onDown);
  }

  private readLevel(): number {
    const raw = clamp01(Math.pow(clamp01(this.getLevel() * 2.4), 0.75));
    this.levelSmoothed =
      raw > this.levelSmoothed
        ? lerp(this.levelSmoothed, raw, 0.55)
        : lerp(this.levelSmoothed, raw, 0.1);
    return this.levelSmoothed;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const { w, h, dpr } = this.dims;
    const ctx = this.ctx;
    if (w === 0 || h === 0) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }

    // ease tuning toward the phase target (replaces the app's anime.js tween)
    const target = PHASE_TUNING[this.phase];
    this.tuning.spin = lerp(this.tuning.spin, target.spin, 1 - Math.exp(-dt * 4));
    this.tuning.energy = lerp(this.tuning.energy, target.energy, 1 - Math.exp(-dt * 4));

    const tn = this.tuning;
    const level = this.readLevel();
    const process = this.phase === 'thinking' || this.phase === 'tool';
    this.spinT += dt * (this.reduced ? 0.01 : 0.03 + level * 0.015);
    this.waveT += dt * (this.reduced ? 0.08 : 0.7 + tn.spin * 0.35 + level * 0.4);

    const waveAmp = process
      ? 0.09 + 0.07 * (0.5 + 0.5 * Math.sin(this.waveT * 1.25)) + level * 0.09
      : 0.045 + level * 0.34;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.33;

    const cosY = Math.cos(this.spinT);
    const sinY = Math.sin(this.spinT);
    const cosX = Math.cos(0.42);
    const sinX = Math.sin(0.42);

    const { base, proj, prev, dispCur, ripples } = this;

    for (let i = 0; i < N; i++) {
      const bx = base[i]![0];
      const by = base[i]![1];
      const bz = base[i]![2];
      const slow =
        (Math.sin(3.0 * by + this.waveT * 0.9) +
          Math.sin(3.3 * bx - this.waveT * 0.7) +
          Math.sin(2.7 * bz + this.waveT * 1.1)) /
        3;
      const fast =
        (Math.sin(5.2 * by - this.waveT * 2.0) +
          Math.sin(4.8 * (bx + bz) + this.waveT * 1.6)) /
        2;
      let field = slow * 0.6 + fast * 0.4;
      if (process) field = field * 0.4 + 0.85 * Math.sin(by * 4 - this.waveT * 1.7);
      let t = waveAmp * field;
      for (let r = 0; r < ripples.length; r++) {
        const rp = ripples[r]!;
        const dpx = prev[i * 2]! - rp.sx;
        const dpy = prev[i * 2 + 1]! - rp.sy;
        const d = Math.sqrt(dpx * dpx + dpy * dpy) / R;
        const age = (now - rp.born) / 1000;
        t += 0.06 * Math.exp(-age * 1.8) * Math.exp(-d * 1.4) * Math.sin(d * 6 - age * 5);
      }
      if (t > MAX_DISP) t = MAX_DISP;
      else if (t < -MAX_DISP) t = -MAX_DISP;
      dispCur[i]! += (t - dispCur[i]!) * SMOOTH;

      const s = 1 + dispCur[i]!;
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
      proj[i * 4] = px;
      proj[i * 4 + 1] = py;
      proj[i * 4 + 2] = persp;
      proj[i * 4 + 3] = (z1 + 1) / 2;
      prev[i * 2] = px;
      prev[i * 2 + 1] = py;
    }

    ctx.globalCompositeOperation = 'lighter';

    const lineEnergy = 0.09 + tn.energy * 0.2 + level * 0.5;
    ctx.lineWidth = 1 + level * 0.6;
    for (let k = 0; k < this.pairs.length; k++) {
      const a = this.pairs[k]![0];
      const b = this.pairs[k]![1];
      const front = (proj[a * 4 + 3]! + proj[b * 4 + 3]!) / 2;
      const alpha = front * front * lineEnergy;
      if (alpha < 0.012) continue;
      ctx.strokeStyle = `rgba(255, ${Math.round(150 + front * 95)}, ${Math.round(45 + front * 55 + level * 35)}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(proj[a * 4]!, proj[a * 4 + 1]!);
      ctx.lineTo(proj[b * 4]!, proj[b * 4 + 1]!);
      ctx.stroke();
    }

    const order = Array.from({ length: N }, (_, i) => i).sort(
      (p, q) => proj[p * 4 + 3]! - proj[q * 4 + 3]!,
    );
    for (const i of order) {
      const front = proj[i * 4 + 3]!;
      const sc = proj[i * 4 + 2]!;
      const peak = Math.max(0, dispCur[i]!);
      const size = (0.7 + front * 1.9) * sc * (1 + level * 0.8 + peak * 2.5);
      const a = 0.24 + front * 0.66 + level * 0.18 + peak * 1.0;
      const g = Math.min(255, Math.round(155 + front * 80 + peak * 120));
      const bl = Math.min(255, Math.round(45 + front * 120 + level * 45 + peak * 200));
      ctx.fillStyle = `rgba(255, ${g}, ${bl}, ${Math.min(1, a)})`;
      ctx.beginPath();
      ctx.arc(proj[i * 4]!, proj[i * 4 + 1]!, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const glowR = R * (0.55 + level * 0.65);
    const coreA = 0.14 + level * 0.5 + tn.energy * 0.1;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, glowR));
    grad.addColorStop(0, `rgba(255, 245, 220, ${coreA})`);
    grad.addColorStop(0.42, `rgba(255, 174, 60, ${coreA * 0.5})`);
    grad.addColorStop(1, 'rgba(255, 122, 24, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    this.raf = requestAnimationFrame(this.frame);
  };
}

/** Warm stage the gold sphere sits on — same medallion as the product. */
export const STAGE_GRADIENT =
  'radial-gradient(circle at 50% 42%, #261a0b 0%, #15100a 58%, #0c0805 100%)';
