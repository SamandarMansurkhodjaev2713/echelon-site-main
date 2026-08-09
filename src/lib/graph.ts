/*
 * Interactive memory graph — a faithful miniature of the product's Graph page.
 * ~250 typed nodes, force layout, wheel/pinch zoom, pan, node drag, and a
 * click-to-open note card. Pure canvas + vanilla TS, sim pauses off-screen.
 */

type NodeType = 'owner' | 'job' | 'person' | 'project' | 'theme' | 'memory' | 'thought';

interface GNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  type: NodeType;
  label: string;
  summary: string;
}

interface Edge {
  a: number;
  b: number;
}

interface GraphStrings {
  stats: string;
  hint: string;
  card: { links: string; types: Record<string, string> };
  data: {
    job: string;
    people: string[];
    projects: string[];
    themes: string[];
    memoryTemplates: string[];
    thoughtTemplates: string[];
  };
}

const COLORS: Record<NodeType, string> = {
  owner: '#f5f4ef',
  job: '#14b8a6',
  person: '#e5a33a',
  project: '#4ecb58',
  theme: '#8a8a85',
  memory: '#e55353',
  thought: '#6e6e6a',
};

const RADII: Record<NodeType, number> = {
  owner: 14,
  job: 10,
  person: 6.5,
  project: 6,
  theme: 5.5,
  memory: 3.6,
  thought: 3,
};

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

export function initGraph(container: HTMLElement, strings: GraphStrings): () => void {
  const canvas = container.querySelector('canvas');
  const statsEl = container.querySelector<HTMLElement>('[data-graph-stats]');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // ---- build the world -------------------------------------------------
  const rand = mulberry32(11);
  const nodes: GNode[] = [];
  const edges: Edge[] = [];
  const link = (a: number, b: number) => edges.push({ a, b });
  const spread = (d: number) => {
    const a = rand() * Math.PI * 2;
    const r = 40 + rand() * d;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  };
  const add = (type: NodeType, label: string, summary: string, d = 260): number => {
    const { x, y } = spread(d);
    nodes.push({ x, y, vx: 0, vy: 0, r: RADII[type], type, label, summary });
    return nodes.length - 1;
  };

  const tName = (t: NodeType) => strings.card.types[t] ?? t;
  const owner = add('owner', tName('owner'), '');
  nodes[owner]!.x = 0;
  nodes[owner]!.y = 0;
  const job = add('job', strings.data.job, '');
  link(owner, job);

  const people: number[] = strings.data.people.map((p) => {
    const i = add('person', p.split('·')[0]!.trim(), p);
    if (rand() < 0.9) link(owner, i);
    else link(job, i);
    return i;
  });

  const projects: number[] = strings.data.projects.map((p) => {
    const i = add('project', p, p);
    link(rand() < 0.5 ? owner : job, i);
    // 1-3 people per project
    const k = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < k; j++) link(i, people[Math.floor(rand() * people.length)]!);
    return i;
  });

  const themes: number[] = strings.data.themes.map((th) => {
    const i = add('theme', th, th);
    link(owner, i);
    return i;
  });

  // memories: templated agreements attached to people (+ sometimes projects/themes)
  const M = 150;
  for (let m = 0; m < M; m++) {
    const tpl = strings.data.memoryTemplates[m % strings.data.memoryTemplates.length]!;
    const pi = people[Math.floor(rand() * people.length)]!;
    const text = tpl.replace('{p}', nodes[pi]!.label);
    const i = add('memory', text, text, 420);
    link(pi, i);
    if (rand() < 0.25) link(i, projects[Math.floor(rand() * projects.length)]!);
    if (rand() < 0.3) link(i, themes[Math.floor(rand() * themes.length)]!);
  }

  const T = 40;
  for (let m = 0; m < T; m++) {
    const tpl = strings.data.thoughtTemplates[m % strings.data.thoughtTemplates.length]!;
    const th = themes[Math.floor(rand() * themes.length)]!;
    const text = tpl.replace('{t}', nodes[th]!.label.toLowerCase());
    const i = add('thought', text, text, 460);
    link(th, i);
    if (rand() < 0.2) link(i, people[Math.floor(rand() * people.length)]!);
  }

  const degree = new Array(nodes.length).fill(0) as number[];
  for (const e of edges) {
    degree[e.a]!++;
    degree[e.b]!++;
  }

  if (statsEl) {
    statsEl.textContent = strings.stats
      .replace('{n}', String(nodes.length))
      .replace('{e}', String(edges.length));
  }

  // ---- camera ----------------------------------------------------------
  let W = 0;
  let H = 0;
  let dpr = 1;
  const cam = { x: 0, y: 0, scale: 0.9 };
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

  const toWorld = (sx: number, sy: number) => ({
    x: (sx - W / 2) / cam.scale + cam.x,
    y: (sy - H / 2) / cam.scale + cam.y,
  });

  // ---- info card (HTML overlay) ---------------------------------------
  const card = document.createElement('div');
  card.className = 'ui-graph__card';
  card.hidden = true;
  container.appendChild(card);
  let selected = -1;

  const openCard = (i: number) => {
    selected = i;
    const n = nodes[i]!;
    card.innerHTML = `
      <span class="ui-graph__card-type" style="color:${COLORS[n.type]};border-color:${COLORS[n.type]}">${tName(n.type)}</span>
      <div class="ui-graph__card-title">${escapeHtml(n.label)}</div>
      ${n.summary && n.summary !== n.label ? `<div class="ui-graph__card-sum">${escapeHtml(n.summary)}</div>` : ''}
      <div class="ui-graph__card-links mono">${strings.card.links}: ${degree[i]}</div>`;
    card.hidden = false;
  };
  const closeCard = () => {
    selected = -1;
    card.hidden = true;
  };

  const positionCard = () => {
    if (selected < 0) return;
    const n = nodes[selected]!;
    const sx = (n.x - cam.x) * cam.scale + W / 2;
    const sy = (n.y - cam.y) * cam.scale + H / 2;
    const pad = 12;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    let left = sx + pad;
    let top = sy - ch / 2;
    if (left + cw > W - 8) left = sx - cw - pad;
    top = Math.max(8, Math.min(H - ch - 8, top));
    card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };

  // ---- interaction -----------------------------------------------------
  const pointers = new Map<number, { x: number; y: number }>();
  let dragNode = -1;
  let panning = false;
  let moved = false;
  let last = { x: 0, y: 0 };
  let pinchDist = 0;

  const pick = (sx: number, sy: number): number => {
    const w = toWorld(sx, sy);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      const dx = n.x - w.x;
      const dy = n.y - w.y;
      const d = dx * dx + dy * dy;
      const hit = (n.r + 6 / cam.scale) * (n.r + 6 / cam.scale);
      if (d < hit && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: PointerEvent) => {
    const p = local(e);
    pointers.set(e.pointerId, p);
    canvas.setPointerCapture(e.pointerId);
    moved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      dragNode = -1;
      panning = false;
      return;
    }
    dragNode = pick(p.x, p.y);
    panning = dragNode < 0;
    last = p;
    alpha = Math.max(alpha, 0.06);
  };

  const move = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    const p = local(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchDist > 0) zoomAt((a!.x + b!.x) / 2, (a!.y + b!.y) / 2, d / pinchDist);
      pinchDist = d;
      return;
    }
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    if (dragNode >= 0) {
      const w = toWorld(p.x, p.y);
      const n = nodes[dragNode]!;
      n.x = w.x;
      n.y = w.y;
      n.vx = 0;
      n.vy = 0;
      alpha = Math.max(alpha, 0.12);
    } else if (panning) {
      cam.x -= dx / cam.scale;
      cam.y -= dy / cam.scale;
    }
    last = p;
  };

  const up = (e: PointerEvent) => {
    const p = local(e);
    pointers.delete(e.pointerId);
    pinchDist = 0;
    if (!moved) {
      const hit = pick(p.x, p.y);
      if (hit >= 0) openCard(hit);
      else closeCard();
    }
    dragNode = -1;
    panning = false;
  };

  const zoomAt = (sx: number, sy: number, factor: number) => {
    const before = toWorld(sx, sy);
    cam.scale = Math.min(3.2, Math.max(0.35, cam.scale * factor));
    const after = toWorld(sx, sy);
    cam.x += before.x - after.x;
    cam.y += before.y - after.y;
  };

  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016));
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', wheel, { passive: false });

  // ---- simulation ------------------------------------------------------
  let alpha = 1;
  const CELL = 60;

  const step = () => {
    if (alpha > 0.003) {
      // repulsion via spatial hash (250 nodes → cheap)
      const grid = new Map<number, number[]>();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const key = ((n.x / CELL) | 0) * 10007 + ((n.y / CELL) | 0);
        let cell = grid.get(key);
        if (!cell) grid.set(key, (cell = []));
        cell.push(i);
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const gx = (n.x / CELL) | 0;
        const gy = (n.y / CELL) | 0;
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const cell = grid.get((gx + ox) * 10007 + (gy + oy));
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const o = nodes[j]!;
              let dx = n.x - o.x;
              let dy = n.y - o.y;
              let d2 = dx * dx + dy * dy;
              if (d2 === 0) {
                dx = rand() - 0.5;
                dy = rand() - 0.5;
                d2 = 1;
              }
              if (d2 > 8000) continue;
              if (d2 < 60) d2 = 60; // clamp — keeps the sim from exploding
              const f = (alpha * 900) / d2;
              dx *= f;
              dy *= f;
              n.vx += dx;
              n.vy += dy;
              o.vx -= dx;
              o.vy -= dy;
            }
          }
        }
      }
      for (const e of edges) {
        const a = nodes[e.a]!;
        const b = nodes[e.b]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const want = a.type === 'owner' || b.type === 'owner' ? 120 : 46;
        const f = ((d - want) / d) * alpha * 0.35;
        a.vx += dx * f;
        a.vy += dy * f;
        b.vx -= dx * f;
        b.vy -= dy * f;
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        if (i === dragNode) continue;
        n.vx += -n.x * alpha * 0.004;
        n.vy += -n.y * alpha * 0.004;
        n.vx *= 0.86;
        n.vy *= 0.86;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 14) {
          n.vx = (n.vx / sp) * 14;
          n.vy = (n.vy / sp) * 14;
        }
        n.x += n.vx;
        n.y += n.vy;
      }
      alpha *= 0.985;
    }

    // ---- draw ----------------------------------------------------------
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    ctx.lineWidth = 1 / cam.scale;
    ctx.strokeStyle = `rgba(160,160,155,${Math.min(0.22, 0.1 + cam.scale * 0.05)})`;
    ctx.beginPath();
    for (const e of edges) {
      const a = nodes[e.a]!;
      const b = nodes[e.b]!;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      ctx.fillStyle = COLORS[n.type];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (i === selected) {
        ctx.strokeStyle = '#f5f4ef';
        ctx.lineWidth = 1.5 / cam.scale;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3 / cam.scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // labels appear as you zoom in — like the real Graph page
    const showBig = cam.scale > 0.75;
    const showSmall = cam.scale > 1.7;
    if (showBig) {
      ctx.textAlign = 'center';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const big =
          n.type === 'owner' || n.type === 'job' || n.type === 'person' ||
          n.type === 'project' || n.type === 'theme';
        if (!big && !showSmall) continue;
        const size = big ? 11 / cam.scale : 9 / cam.scale;
        if (size < 3) continue;
        ctx.font = `500 ${size}px 'Golos Text Variable', system-ui`;
        ctx.fillStyle = big ? 'rgba(245,244,239,0.85)' : 'rgba(160,160,155,0.75)';
        const text = n.label.length > 26 ? n.label.slice(0, 25) + '…' : n.label;
        ctx.fillText(text, n.x, n.y - n.r - 5 / cam.scale);
      }
    }

    ctx.restore();
    positionCard();
    raf = requestAnimationFrame(step);
  };

  let raf = 0;
  let running = false;
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
    canvas.removeEventListener('wheel', wheel);
  };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
