/*
 * The walkable mini-Echelon: sidebar/tab navigation between live panes,
 * scripted chat, interactive graph, vault filters + note cards,
 * kanban drag-and-drop, automation toggles.
 */
import { initGraph } from './graph';

export function initTouch() {
  const stage = document.querySelector<HTMLElement>('[data-touch-stage]');
  if (!stage) return;

  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-touch-tab]'));
  const navItems = Array.from(
    stage.querySelectorAll<HTMLButtonElement>('[data-app-nav]'),
  );
  const panes = Array.from(stage.querySelectorAll<HTMLElement>('[data-touch-pane]'));
  const titleEl = stage.querySelector<HTMLElement>('[data-app-title]');

  let graphStarted = false;
  const startGraph = () => {
    if (graphStarted) return;
    graphStarted = true;
    const g = stage.querySelector<HTMLElement>('[data-graph]');
    const dataEl = document.getElementById('graph-data');
    if (g && dataEl) initGraph(g, JSON.parse(dataEl.textContent ?? '{}'));
  };

  const select = (id: string) => {
    for (const t of tabs) {
      const on = t.dataset.touchTab === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const n of navItems) {
      const on = n.dataset.appNav === id;
      n.classList.toggle('active', on);
      if (on && titleEl) titleEl.textContent = n.dataset.title ?? '';
    }
    for (const p of panes) {
      p.hidden = p.dataset.touchPane !== id;
    }
    if (id === 'graph') startGraph();
  };

  tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.touchTab!)));
  navItems.forEach((n) => n.addEventListener('click', () => select(n.dataset.appNav!)));

  initChat();
  initVault(stage);
  initKanbanDnd(stage);
  initAutomations(stage);
}

/* ---------- scripted chat ---------- */
function initChat() {
  const thread = document.querySelector<HTMLElement>('[data-chat-thread]');
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-chip]'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const addBubble = (cls: string, text: string) => {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    thread?.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 240ms ease, transform 240ms ease';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    return el;
  };

  let busy = false;
  chips.forEach((chip) =>
    chip.addEventListener('click', async () => {
      if (busy || !thread) return;
      busy = true;
      chip.disabled = true;
      addBubble('ui-msg-user', chip.textContent?.trim() ?? '');
      await wait(reduced ? 60 : 500);
      const typing = addBubble('ui-tool-row', '');
      typing.innerHTML = '<span class="spin-dot"></span>';
      await wait(reduced ? 60 : 900);
      typing.remove();
      addBubble('ui-msg-assistant', chip.dataset.answer ?? '');
      busy = false;
    }),
  );
}

/* ---------- vault: filters + note card ---------- */
function initVault(stage: HTMLElement) {
  const vault = stage.querySelector<HTMLElement>('[data-vault]');
  if (!vault) return;
  const chips = Array.from(vault.querySelectorAll<HTMLButtonElement>('[data-vault-filter]'));
  const rows = Array.from(vault.querySelectorAll<HTMLButtonElement>('[data-vault-type]'));

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const f = chip.dataset.vaultFilter!;
      chips.forEach((c) => c.classList.toggle('active', c === chip));
      rows.forEach((r) => {
        r.hidden = f !== 'all' && r.dataset.vaultType !== f;
      });
    }),
  );

  let card: HTMLElement | null = null;
  rows.forEach((row) =>
    row.addEventListener('click', () => {
      card?.remove();
      card = document.createElement('div');
      card.className = 'ui-vault__card';
      const label = row.querySelector('.ui-vault__label')?.textContent ?? '';
      const type = row.querySelector('.ui-vault__type')?.outerHTML ?? '';
      card.innerHTML = `
        <div class="ui-vault__card-head">${type}<button class="ui-vault__card-close" aria-label="close">×</button></div>
        <div class="ui-vault__card-title">${label}</div>
        <div class="ui-vault__card-sum">${row.dataset.summary ?? ''}</div>
        <div class="ui-vault__card-upd mono">${row.dataset.updated ?? ''}</div>`;
      row.insertAdjacentElement('afterend', card);
      card
        .querySelector('.ui-vault__card-close')
        ?.addEventListener('click', () => card?.remove());
    }),
  );
}

/* ---------- kanban drag & drop ---------- */
function initKanbanDnd(stage: HTMLElement) {
  const board = stage.querySelector<HTMLElement>('.ui-kanban');
  if (!board) return;
  const cols = Array.from(board.querySelectorAll<HTMLElement>('.ui-kanban__col'));

  const refreshCounts = () => {
    for (const col of cols) {
      const count = col.querySelectorAll('.ui-card').length;
      const el = col.querySelector('.ui-kanban__count');
      if (el) el.textContent = String(count);
    }
  };

  let dragging: HTMLElement | null = null;
  let ghost: HTMLElement | null = null;

  const onDown = (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.ui-card');
    if (!card) return;
    e.preventDefault();
    dragging = card;
    const r = card.getBoundingClientRect();
    ghost = card.cloneNode(true) as HTMLElement;
    ghost.className += ' ui-card--ghost';
    ghost.style.width = `${r.width}px`;
    ghost.style.left = `${e.clientX - r.width / 2}px`;
    ghost.style.top = `${e.clientY - 20}px`;
    document.body.appendChild(ghost);
    card.classList.add('ui-card--lifted');
    board.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging || !ghost) return;
    ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
    ghost.style.top = `${e.clientY - 20}px`;
    for (const col of cols) {
      const r = col.getBoundingClientRect();
      col.classList.toggle(
        'ui-kanban__col--over',
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
      );
    }
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    const target = cols.find((col) => {
      const r = col.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (target && !target.contains(dragging)) target.appendChild(dragging);
    dragging.classList.remove('ui-card--lifted');
    cols.forEach((c) => c.classList.remove('ui-kanban__col--over'));
    ghost?.remove();
    ghost = null;
    dragging = null;
    refreshCounts();
  };

  board.addEventListener('pointerdown', onDown);
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerup', onUp);
  board.addEventListener('pointercancel', onUp);
}

/* ---------- automations toggles ---------- */
function initAutomations(stage: HTMLElement) {
  const rows = Array.from(stage.querySelectorAll<HTMLElement>('[data-autorow]'));
  for (const row of rows) {
    const toggle = row.querySelector<HTMLElement>('.ui-autorow__toggle');
    const badge = row.querySelector<HTMLElement>('.ui-autorow__badge');
    if (!toggle || !badge) continue;
    const activeText = badge.textContent ?? '';
    const pausedText = badge.dataset.paused ?? '';
    toggle.style.cursor = 'pointer';
    toggle.addEventListener('click', () => {
      const off = toggle.classList.toggle('off');
      badge.textContent = off ? pausedText : activeText;
      badge.classList.toggle('ui-autorow__badge--paused', off);
    });
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
