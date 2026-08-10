/*
 * The teaching moment (§15, part one) and its consequence (part two).
 *
 * One module owns both ends of the session-memory feature so the contract
 * between them cannot drift: the panel writes `rule`, and every element marked
 * `data-rule-target` renders the reply that rule produces.
 */

import { register } from './lifecycle';
import { session } from '../session/state';
import type { RuleChoice } from '../session/state';

const RULES: readonly RuleChoice[] = ['concise', 'formal', 'skip'];

const isRule = (v: string | undefined): v is RuleChoice =>
  !!v && (RULES as readonly string[]).includes(v);

export function initTeach(): () => void {
  const store = session();
  const disposers: Array<() => void> = [];

  const panel = document.querySelector<HTMLElement>('[data-teach]');
  if (panel) {
    const options = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-teach-option]'));
    const stamp = panel.querySelector<HTMLElement>('[data-teach-stamp]');
    const nameEl = panel.querySelector<HTMLElement>('[data-teach-name]');
    const after = panel.querySelector<HTMLElement>('[data-teach-after]');

    let names: Record<string, string> = {};
    const namesEl = document.querySelector('[data-teach-names]');
    if (namesEl?.textContent) {
      try {
        names = JSON.parse(namesEl.textContent) as Record<string, string>;
      } catch {
        names = {};
      }
    }

    const paint = (rule: RuleChoice | null) => {
      for (const o of options) {
        o.setAttribute('aria-pressed', String(o.dataset.teachOption === rule));
      }
      if (!rule) {
        stamp?.setAttribute('hidden', '');
        after?.setAttribute('hidden', '');
        return;
      }
      if (nameEl) nameEl.textContent = names[rule] ?? '';
      stamp?.removeAttribute('hidden');
      after?.removeAttribute('hidden');
    };

    for (const o of options) {
      const handler = () => {
        const rule = o.dataset.teachOption;
        if (isRule(rule)) store.teachRule(rule);
      };
      o.addEventListener('click', handler);
      disposers.push(() => o.removeEventListener('click', handler));
    }

    disposers.push(store.subscribe((s) => paint(s.rule)));
    // The panel declares its own readiness: page-level readiness is not the
    // same question as "is this control wired up", and tests should wait on
    // the specific thing they are about to press.
    panel.setAttribute('data-teach-ready', '');
    disposers.push(() => panel.removeAttribute('data-teach-ready'));
  }

  /* ---- part two: everywhere the rule is actually applied ---- */
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-rule-target]'));
  if (targets.length) {
    disposers.push(
      store.subscribe((s) => {
        for (const el of targets) {
          const rule = s.rule;
          const body = el.querySelector<HTMLElement>('[data-rule-text]');
          const note = el.querySelector<HTMLElement>('[data-rule-note]');
          const name = el.querySelector<HTMLElement>('[data-rule-name]');

          let replies: Record<string, string> = {};
          let ruleNames: Record<string, string> = {};
          try {
            replies = JSON.parse(el.dataset.replies ?? '{}') as Record<string, string>;
            ruleNames = JSON.parse(el.dataset.ruleNames ?? '{}') as Record<string, string>;
          } catch {
            /* fall through to the neutral reply below */
          }

          const key = rule ?? 'skip';
          if (body) body.textContent = replies[key] ?? replies.skip ?? body.textContent;
          if (name) name.textContent = ruleNames[key] ?? '';
          // The footnote only appears when the visitor actually taught something.
          if (note) note.hidden = !rule || rule === 'skip';
          el.dataset.ruleApplied = rule ?? 'none';
        }
      }),
    );
  }

  return register(() => {
    while (disposers.length) disposers.pop()?.();
  });
}
