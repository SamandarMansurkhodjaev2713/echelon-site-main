/*
 * "Потрогайте" — tab switching between recreated app screens, the mini graph,
 * and a guided scripted chat (chips play canned exchanges with typing rhythm).
 */
import { initGraph } from './graph';

export function initTouch() {
  const tabs = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-touch-tab]'),
  );
  const panes = Array.from(document.querySelectorAll<HTMLElement>('[data-touch-pane]'));
  if (tabs.length === 0) return;

  let graphStarted = false;

  const select = (id: string) => {
    for (const t of tabs) {
      const on = t.dataset.touchTab === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const p of panes) {
      p.hidden = p.dataset.touchPane !== id;
      p.classList.toggle('active', !p.hidden);
    }
    if (id === 'graph' && !graphStarted) {
      graphStarted = true;
      const g = document.querySelector<HTMLElement>('[data-touch-pane="graph"] [data-graph]');
      if (g) initGraph(g);
    }
  };

  tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.touchTab!)));

  // Scripted chat chips
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
      const typing = addBubble('ui-tool-row', '…');
      typing.innerHTML = '<span class="spin-dot"></span>';
      await wait(reduced ? 60 : 900);
      typing.remove();
      addBubble('ui-msg-assistant', chip.dataset.answer ?? '');
      busy = false;
    }),
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
