/*
 * Accessible tabs.
 *
 * The baseline had two `role="tablist"` widgets with none of the contract:
 * no `aria-controls`, no `role="tabpanel"`, no roving tabindex, no arrow keys.
 * Screen readers announced "tab" and then had nowhere to go. This is the one
 * implementation both tab groups on the site use.
 */

import { register } from './lifecycle';

export function initTabs(
  listSelector: string,
  panelSelector: string,
  onChange?: (id: string) => void,
): () => void {
  const list = document.querySelector<HTMLElement>(listSelector);
  if (!list) return () => {};

  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>(panelSelector));
  if (!tabs.length) return () => {};

  const idOf = (t: HTMLElement) => t.getAttribute('aria-controls') ?? '';

  const select = (index: number, focus = false) => {
    const target = tabs[index];
    if (!target) return;
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-on', on);
    });
    for (const p of panels) p.hidden = p.id !== idOf(target);
    if (focus) target.focus();
    onChange?.(target.dataset.biz ?? target.dataset.tab ?? idOf(target));
  };

  const onClick = (e: Event) => {
    const i = tabs.indexOf(e.currentTarget as HTMLButtonElement);
    if (i >= 0) select(i);
  };

  const onKey = (e: KeyboardEvent) => {
    const current = tabs.indexOf(e.currentTarget as HTMLButtonElement);
    if (current < 0) return;
    const last = tabs.length - 1;
    let next = -1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = current === last ? 0 : current + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = current === 0 ? last : current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next, true);
  };

  for (const t of tabs) {
    t.addEventListener('click', onClick);
    t.addEventListener('keydown', onKey);
  }

  return register(() => {
    for (const t of tabs) {
      t.removeEventListener('click', onClick);
      t.removeEventListener('keydown', onKey);
    }
  });
}
