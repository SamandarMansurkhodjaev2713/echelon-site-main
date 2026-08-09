/*
 * Mini force-directed memory graph — the site's honest miniature of the
 * product's Graph page (force layout, owner hub at center, typed colors,
 * draggable nodes). ~40 nodes so it runs happily on a phone.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  fixed?: boolean;
}

interface Edge {
  a: number;
  b: number;
}

const COLORS = {
  owner: '#f5f4ef',
  people: '#e5a33a',
  projects: '#4ecb58',
  memories: '#e55353',
  themes: '#8a8a85',
};

export function initGraph(container: HTMLElement): () => void {
  const canvas = container.querySelector('canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let W = 0;
  let H = 0;
  let dpr = 1;
  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = container.clientWidth;
    H = container.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  };
  fit();
  const obs = new ResizeObserver(fit);
  obs.observe(container);

  // Build the little world: owner + rings of typed nodes
  const rand = mulberry32(7);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  nodes.push({ x: 0, y: 0, vx: 0, vy: 0, r: 11, color: COLORS.owner, fixed: true });

  const spawn = (count: number, color: string, r: number, linkToOwner: number) => {
    const start = nodes.length;
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const d = 60 + rand() * 120;
      nodes.push({
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        vx: 0,
        vy: 0,
        r,
        color,
      });
      if (rand() < linkToOwner) edges.push({ a: 0, b: start + i });
    }
    return start;
  };

  const p0 = spawn(9, COLORS.people, 5.5, 0.85);
  const pr0 = spawn(6, COLORS.projects, 5, 0.7);
  const m0 = spawn(16, COLORS.memories, 3.5, 0.15);
  const t0 = spawn(5, COLORS.themes, 4, 0.4);

  // memories cluster around people/projects; themes tie clusters
  for (let i = 0; i < 16; i++) {
    const host = rand() < 0.6 ? p0 + Math.floor(rand() * 9) : pr0 + Math.floor(rand() * 6);
    edges.push({ a: host, b: m0 + i });
    if (rand() < 0.3) edges.push({ a: t0 + Math.floor(rand() * 5), b: m0 + i });
  }
  for (let i = 0; i < 6; i++) {
    edges.push({ a: p0 + Math.floor(rand() * 9), b: pr0 + Math.floor(rand() * 6) });
  }

  // Drag
  let dragging: Node | null = null;
  const pick = (mx: number, my: number): Node | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]!;
      const dx = n.x + W / 2 - mx;
      const dy = n.y + H / 2 - my;
      if (dx * dx + dy * dy < (n.r + 8) * (n.r + 8)) return n;
    }
    return null;
  };
  const toLocal = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { mx: e.clientX - r.left, my: e.clientY - r.top };
  };
  const down = (e: PointerEvent) => {
    const { mx, my } = toLocal(e);
    dragging = pick(mx, my);
    if (dragging) {
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const { mx, my } = toLocal(e);
    dragging.x = mx - W / 2;
    dragging.y = my - H / 2;
    dragging.vx = 0;
    dragging.vy = 0;
  };
  const up = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  let raf = 0;
  let running = false;

  const step = () => {
    // physics
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (n.fixed || n === dragging) continue;
      // centering
      n.vx -= n.x * 0.0012;
      n.vy -= n.y * 0.0012;
      // repulsion
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const o = nodes[j]!;
        const dx = n.x - o.x;
        const dy = n.y - o.y;
        const d2 = dx * dx + dy * dy + 24;
        const f = 220 / d2;
        n.vx += dx * f * 0.02;
        n.vy += dy * f * 0.02;
      }
    }
    for (const e of edges) {
      const a = nodes[e.a]!;
      const b = nodes[e.b]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const want = 55;
      const f = ((d - want) / d) * 0.006;
      if (!a.fixed && a !== dragging) {
        a.vx += dx * f;
        a.vy += dy * f;
      }
      if (!b.fixed && b !== dragging) {
        b.vx -= dx * f;
        b.vy -= dy * f;
      }
    }
    for (const n of nodes) {
      if (n.fixed || n === dragging) continue;
      n.vx *= 0.9;
      n.vy *= 0.9;
      n.x += n.vx;
      n.y += n.vy;
    }

    // draw
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.strokeStyle = 'rgba(160,160,155,0.14)';
    ctx.lineWidth = 1;
    for (const e of edges) {
      const a = nodes[e.a]!;
      const b = nodes[e.b]!;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const n of nodes) {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    raf = requestAnimationFrame(step);
  };

  // Run only while visible
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!entry?.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0.05 },
  );
  io.observe(container);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    obs.disconnect();
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
