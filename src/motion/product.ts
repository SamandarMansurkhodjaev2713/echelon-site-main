/*
 * The walkable product (§22). Ported from the baseline's touch.ts with the
 * accessibility gaps closed:
 *   - the kanban can be operated from the keyboard, not only by pointer
 *   - opening a vault record moves focus into it and returns focus on close
 *   - every control has a translated label instead of a hardcoded English one
 *   - the graph exposes a text alternative and its stats to assistive tech
 *
 * Everything registers a disposer, so nothing here leaks.
 */

import { register, listen } from './lifecycle';
import { prefersReducedMotion } from './media';
import { session } from '../session/state';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function initProduct(): ((id: string) => void) | undefined {
  const stage = document.querySelector<HTMLElement>('[data-product-stage]');
  if (!stage) return undefined;

  const panels = Array.from(stage.querySelectorAll<HTMLElement>('[data-prod-panel]'));
  const navItems = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-app-nav]'));
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-prod-tabs] [role="tab"]'));
  const titleEl = stage.querySelector<HTMLElement>('[data-app-title]');

  let graphStarted = false;
  const startGraph = () => {
    if (graphStarted) return;
    graphStarted = true;
    const host = stage.querySelector<HTMLElement>('[data-graph]');
    const data = document.getElementById('graph-data');
    if (!host || !data?.textContent) return;
    void import('../lib/graph').then((m) => {
      const dispose = m.initGraph(host, JSON.parse(data.textContent!));
      register(dispose);
    });
  };

  const select = (id: string) => {
    for (const n of navItems) {
      const on = n.dataset.appNav === id;
      n.classList.toggle('active', on);
      n.setAttribute('aria-current', on ? 'page' : 'false');
      if (on && titleEl) titleEl.textContent = n.dataset.title ?? '';
    }
    for (const t of tabs) {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-on', on);
    }
    for (const p of panels) p.hidden = p.dataset.prodPanel !== id;
    if (id === 'graph') startGraph();
  };

  for (const n of navItems) {
    const handler = () => select(n.dataset.appNav!);
    n.addEventListener('click', handler);
    register(() => n.removeEventListener('click', handler));
  }

  initScrollHint(stage);
  initChat(stage);
  initVault(stage);
  initKanban(stage);
  initAutomations(stage);

  return select;
}

/* ---------- the scroll hint ---------- */
/*
 * The window's content box scrolls rather than clips (see `.ui-content` in
 * ui.css). On a pointer device the thin scrollbar says so. On a touch device
 * scrollbars are not drawn until a scroll is already under way, which is too
 * late to be an affordance — and this site has been here before: the ledger's
 * off-screen column was reachable by a sideways drag nothing advertised, and on
 * a phone that is not content that is hard to reach, it is content that does
 * not exist. So the box fades its bottom edge while, and only while, something
 * is still underneath it.
 */
function initScrollHint(stage: HTMLElement) {
  const box = stage.querySelector<HTMLElement>('.ui-content');
  if (!box) return;

  let queued = false;
  const sync = () => {
    queued = false;
    box.classList.toggle('is-more', box.scrollHeight - box.scrollTop - box.clientHeight > 1);
  };
  /* Every source below can fire in bursts — a scroll, a pane swap, six bubbles
     arriving in sequence — and the answer is a layout read. Coalesce to one
     read per frame rather than one per event. */
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  };

  listen(box, 'scroll', queue, { passive: true });

  /* The height changes without a scroll: panes swap, the thread grows, the
     fonts land and reflow everything under them. */
  const ro = new ResizeObserver(queue);
  ro.observe(box);
  const mo = new MutationObserver(queue);
  mo.observe(box, { childList: true, subtree: true, attributeFilter: ['hidden'] });
  register(() => {
    ro.disconnect();
    mo.disconnect();
  });

  /* Synchronously, not queued: the first state has to be right in the frame the
     page is first painted in, or a screenshot taken before the rAF lands
     records a box that had more below it and did not say so. */
  sync();
}

/* ---------- scripted chat ---------- */
function initChat(stage: HTMLElement) {
  const thread = stage.querySelector<HTMLElement>('[data-chat-thread]');
  const chips = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-chip]'));
  if (!thread || !chips.length) return;
  const reduced = prefersReducedMotion();

  const addBubble = (cls: string, text: string) => {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    thread.append(el);
    if (!reduced) {
      el.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.16,1,0.3,1)' },
      );
    }
    el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    return el;
  };

  let busy = false;
  for (const chip of chips) {
    const handler = async () => {
      if (busy) return;
      busy = true;
      chip.disabled = true;
      addBubble('ui-msg-user', chip.textContent?.trim() ?? '');
      await wait(reduced ? 40 : 460);
      const typing = addBubble('ui-tool-row', '');
      typing.innerHTML = '<span class="spin-dot"></span>';
      await wait(reduced ? 40 : 820);
      typing.remove();
      const answer = addBubble('ui-msg-assistant', chip.dataset.answer ?? '');
      answer.setAttribute('tabindex', '-1');
      answer.focus({ preventScroll: true });
      busy = false;
    };
    chip.addEventListener('click', handler);
    register(() => chip.removeEventListener('click', handler));
  }
}

/* ---------- vault: filters + record ---------- */
function initVault(stage: HTMLElement) {
  const vault = stage.querySelector<HTMLElement>('[data-vault]');
  if (!vault) return;
  const chips = Array.from(vault.querySelectorAll<HTMLButtonElement>('[data-vault-filter]'));
  const rows = Array.from(vault.querySelectorAll<HTMLButtonElement>('[data-vault-type]'));
  const closeLabel = vault.dataset.closeLabel ?? 'Close';

  for (const chip of chips) {
    const handler = () => {
      const f = chip.dataset.vaultFilter!;
      for (const c of chips) {
        const on = c === chip;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', String(on));
      }
      for (const r of rows) r.hidden = f !== 'all' && r.dataset.vaultType !== f;
    };
    chip.addEventListener('click', handler);
    register(() => chip.removeEventListener('click', handler));
  }

  let card: HTMLElement | null = null;
  let opener: HTMLElement | null = null;

  const closeCard = () => {
    card?.remove();
    card = null;
    for (const r of rows) r.setAttribute('aria-expanded', 'false');
    opener?.focus();
    opener = null;
  };

  for (const row of rows) {
    row.setAttribute('aria-expanded', 'false');
    const handler = () => {
      const reopening = opener === row;
      closeCard();
      if (reopening) return;
      opener = row;
      row.setAttribute('aria-expanded', 'true');

      card = document.createElement('div');
      card.className = 'ui-vault__card';
      card.setAttribute('role', 'group');
      card.tabIndex = -1;

      const head = document.createElement('div');
      head.className = 'ui-vault__card-head';
      const type = row.querySelector('.ui-vault__type')?.cloneNode(true);
      if (type) head.append(type);
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'ui-vault__card-close';
      close.textContent = '×';
      close.setAttribute('aria-label', closeLabel);
      head.append(close);

      const title = document.createElement('div');
      title.className = 'ui-vault__card-title';
      title.textContent = row.querySelector('.ui-vault__label')?.textContent ?? '';

      const sum = document.createElement('div');
      sum.className = 'ui-vault__card-sum';
      sum.textContent = row.dataset.summary ?? '';

      const upd = document.createElement('div');
      upd.className = 'ui-vault__card-upd sys';
      upd.textContent = row.dataset.updated ?? '';

      card.append(head, title, sum, upd);
      row.insertAdjacentElement('afterend', card);
      card.focus({ preventScroll: true });

      close.addEventListener('click', closeCard);
      card.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Escape') closeCard();
      });
    };
    row.addEventListener('click', handler);
    register(() => row.removeEventListener('click', handler));
  }

  register(closeCard);
}

/* ---------- kanban: pointer drag + full keyboard path ---------- */
function initKanban(stage: HTMLElement) {
  const board = stage.querySelector<HTMLElement>('.ui-kanban');
  if (!board) return;
  const cols = Array.from(board.querySelectorAll<HTMLElement>('.ui-kanban__col'));
  const live = stage.querySelector<HTMLElement>('[data-kanban-live]');
  const msgGrabbed = board.dataset.grabbed ?? '';
  const msgDropped = board.dataset.dropped ?? '';

  const announce = (text: string) => {
    if (live) live.textContent = text;
  };

  const refreshCounts = () => {
    for (const col of cols) {
      const el = col.querySelector('.ui-kanban__count');
      if (el) el.textContent = String(col.querySelectorAll('.ui-card').length);
    }
  };

  const colName = (col: HTMLElement) =>
    col.querySelector('.ui-kanban__name')?.textContent?.trim() ?? '';

  const moveTo = (card: HTMLElement, col: HTMLElement) => {
    if (col.contains(card)) return;
    col.append(card);
    refreshCounts();
    announce(`${msgDropped} ${colName(col)}`);
  };

  /* --- keyboard --- */
  let grabbed: HTMLElement | null = null;

  const onCardKey = (e: KeyboardEvent) => {
    const card = e.currentTarget as HTMLElement;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (grabbed === card) {
        grabbed = null;
        card.removeAttribute('data-grabbed');
        card.setAttribute('aria-grabbed', 'false');
      } else {
        grabbed = card;
        card.setAttribute('data-grabbed', '');
        card.setAttribute('aria-grabbed', 'true');
        announce(msgGrabbed);
      }
      return;
    }
    if (e.key === 'Escape' && grabbed === card) {
      grabbed = null;
      card.removeAttribute('data-grabbed');
      card.setAttribute('aria-grabbed', 'false');
      return;
    }
    if (grabbed !== card) return;
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const from = cols.findIndex((c) => c.contains(card));
    const to = Math.min(cols.length - 1, Math.max(0, from + dir));
    if (to !== from && cols[to]) {
      moveTo(card, cols[to]!);
      card.focus();
    }
  };

  for (const card of board.querySelectorAll<HTMLElement>('.ui-card')) {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-grabbed', 'false');
    card.addEventListener('keydown', onCardKey);
    register(() => card.removeEventListener('keydown', onCardKey));
  }

  /* --- pointer --- */
  let dragging: HTMLElement | null = null;
  let ghost: HTMLElement | null = null;

  const hit = (x: number, y: number) =>
    cols.find((col) => {
      const r = col.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return; // touch scrolls; keyboard/tap still works
    const card = (e.target as HTMLElement).closest<HTMLElement>('.ui-card');
    if (!card) return;
    e.preventDefault();
    dragging = card;
    const r = card.getBoundingClientRect();
    ghost = card.cloneNode(true) as HTMLElement;
    ghost.className += ' ui-card--ghost';
    ghost.style.width = `${r.width}px`;
    ghost.style.transform = `translate3d(${e.clientX - r.width / 2}px, ${e.clientY - 20}px, 0)`;
    document.body.append(ghost);
    card.classList.add('ui-card--lifted');
    board.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging || !ghost) return;
    ghost.style.transform = `translate3d(${e.clientX - ghost.offsetWidth / 2}px, ${e.clientY - 20}px, 0)`;
    const over = hit(e.clientX, e.clientY);
    for (const col of cols) col.classList.toggle('ui-kanban__col--over', col === over);
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    const target = hit(e.clientX, e.clientY);
    if (target) moveTo(dragging, target);
    dragging.classList.remove('ui-card--lifted');
    for (const c of cols) c.classList.remove('ui-kanban__col--over');
    ghost?.remove();
    ghost = null;
    dragging = null;
  };

  listen(board, 'pointerdown', onDown as EventListener);
  listen(board, 'pointermove', onMove as EventListener);
  listen(board, 'pointerup', onUp as EventListener);
  listen(board, 'pointercancel', onUp as EventListener);
}

/* ---------- automations ---------- */
function initAutomations(stage: HTMLElement) {
  const store = session();
  for (const row of stage.querySelectorAll<HTMLElement>('[data-autorow]')) {
    const toggle = row.querySelector<HTMLButtonElement>('.ui-autorow__toggle');
    const badge = row.querySelector<HTMLElement>('.ui-autorow__badge');
    if (!toggle || !badge) continue;
    const activeText = badge.dataset.active ?? badge.textContent ?? '';
    const pausedText = badge.dataset.paused ?? '';
    const handler = () => {
      const off = toggle.classList.toggle('off');
      toggle.setAttribute('aria-pressed', String(!off));
      /* The control has just become the other operation, and the contextual
         cursor reads this attribute to decide what to announce. Left alone it
         went on offering to run an automation it would pause. */
      toggle.dataset.cursor = off ? 'run' : 'stop';
      badge.textContent = off ? pausedText : activeText;
      badge.classList.toggle('ui-autorow__badge--paused', off);
      store.remember('actions', 'toggled-automation');
    };
    toggle.addEventListener('click', handler);
    register(() => toggle.removeEventListener('click', handler));
  }
}
