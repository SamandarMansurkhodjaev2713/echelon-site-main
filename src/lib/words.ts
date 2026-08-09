/*
 * "Скажите словами" — the instruction types itself once when visible,
 * the automation row lands after; business switcher re-renders cases.
 */

interface Biz {
  id: string;
  cases: readonly string[];
}

export function initWords() {
  const root = document.querySelector<HTMLElement>('[data-words]');
  const typed = root?.querySelector<HTMLElement>('[data-words-typed]');
  const result = root?.querySelector<HTMLElement>('[data-words-result]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (root && typed && result) {
    const full = typed.dataset.full ?? typed.textContent ?? '';
    if (!reduced) {
      typed.textContent = '';
      result.style.opacity = '0';
      result.style.transform = 'translateY(12px)';
      const later = root.querySelectorAll<HTMLElement>('.words__resultline, .words__correction');
      later.forEach((el) => (el.style.opacity = '0'));

      const io = new IntersectionObserver(
        ([e]) => {
          if (!e?.isIntersecting) return;
          io.disconnect();
          let i = 0;
          const tick = () => {
            i += 1 + Math.floor(Math.random() * 2);
            typed.textContent = full.slice(0, i);
            if (i < full.length) {
              setTimeout(tick, 24 + Math.random() * 40);
            } else {
              setTimeout(() => {
                result.style.transition = 'opacity 320ms ease, transform 320ms ease';
                result.style.opacity = '1';
                result.style.transform = 'none';
                later.forEach((el, k) => {
                  el.style.transition = 'opacity 320ms ease';
                  setTimeout(() => (el.style.opacity = '1'), 150 + k * 150);
                });
              }, 350);
            }
          };
          tick();
        },
        { threshold: 0.4 },
      );
      io.observe(root);
    }
  }

  // Business switcher
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-biz]'));
  const list = document.querySelector<HTMLElement>('[data-biz-cases]');
  if (tabs.length === 0 || !list) return;

  // Cases live in the DOM only for the first business; the rest come from a
  // JSON island the section page injects.
  const dataEl = document.getElementById('biz-data');
  if (!dataEl) return;
  const businesses = JSON.parse(dataEl.textContent ?? '[]') as Biz[];

  const render = (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (!biz) return;
    list.style.opacity = '0';
    setTimeout(
      () => {
        list.innerHTML = biz.cases
          .map((c) => `<li><span class="words__quote">«${escapeHtml(c)}»</span></li>`)
          .join('');
        list.style.opacity = '1';
      },
      reduced ? 0 : 180,
    );
    for (const t of tabs) {
      const on = t.dataset.biz === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    }
  };

  list.style.transition = 'opacity 180ms ease';
  tabs.forEach((t) => t.addEventListener('click', () => render(t.dataset.biz!)));
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
