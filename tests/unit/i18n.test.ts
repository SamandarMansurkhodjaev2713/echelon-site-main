import { describe, expect, it } from 'vitest';
import { ru } from '../../src/i18n/ru';
import { en } from '../../src/i18n/en';
import { uz } from '../../src/i18n/uz';

const DICTS = { ru, en, uz } as const;
type LocaleKey = keyof typeof DICTS;
const LOCALES = Object.keys(DICTS) as LocaleKey[];

/* `Dict = typeof ru` already enforces the shape at compile time. These tests
   cover what the type system cannot see: empty strings, copied-over Russian,
   and strings long enough to break a layout. */

function walk(
  value: unknown,
  path: string,
  visit: (path: string, text: string) => void,
): void {
  if (typeof value === 'string') return visit(path, value);
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, visit);
  }
}

describe.each(LOCALES)('%s dictionary', (locale) => {
  const dict = DICTS[locale];

  it('has no empty strings', () => {
    const empty: string[] = [];
    walk(dict, '', (p, text) => {
      if (text.trim() === '') empty.push(p);
    });
    expect(empty).toEqual([]);
  });

  it('has the same key set as the source locale', () => {
    const keys = (d: unknown) => {
      const out: string[] = [];
      walk(d, '', (p) => out.push(p));
      return out.sort();
    };
    expect(keys(dict)).toEqual(keys(ru));
  });
});

describe('non-Russian locales are actually translated', () => {
  /* Product names, people and demo values are legitimately shared. Everything
     else must not contain Cyrillic on /en/ or /uz/ — that is exactly the bug
     the old UiKanban component shipped. */
  const CYRILLIC = /[Ѐ-ӿ]/;

  it.each(['en', 'uz'] as const)('%s contains no Cyrillic', (locale) => {
    const offenders: Array<[string, string]> = [];
    walk(DICTS[locale], '', (p, text) => {
      // the RU voice recording line is genuinely Russian audio; nothing else
      if (CYRILLIC.test(text)) offenders.push([p, text]);
    });
    expect(offenders).toEqual([]);
  });
});

describe('layout-critical string budgets', () => {
  /* These strings sit in fixed-width furniture. A locale that blows the budget
     shows up here rather than as an overflow bug three viewports later. */
  const BUDGETS: Array<[string, (d: typeof ru) => string, number]> = [
    ['nav.cta', (d) => d.nav.cta, 22],
    ['hero.status', (d) => d.hero.status, 26],
    ['teach.stampLabel', (d) => d.teach.stampLabel, 12],
    ['automate.orderLabel', (d) => d.automate.orderLabel, 16],
    ['boundary.gateLabel', (d) => d.boundary.gateLabel, 22],
    ['night.costLabel', (d) => d.night.costLabel, 14],
    ['handover.sessionLabel', (d) => d.handover.sessionLabel, 12],
    ['tape.label', (d) => d.tape.label, 18],
  ];

  it.each(BUDGETS)('%s fits in every locale', (_name, pick, max) => {
    for (const locale of LOCALES) {
      expect(pick(DICTS[locale]).length).toBeLessThanOrEqual(max);
    }
  });

  it('display headline stays at two or three lines in every locale', () => {
    for (const locale of LOCALES) {
      const lines = DICTS[locale].hero.display.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(24);
    }
  });

  it('cursor labels stay short enough for the pointer chip', () => {
    for (const locale of LOCALES) {
      for (const label of Object.values(DICTS[locale].cursor)) {
        expect(label.length).toBeLessThanOrEqual(18);
      }
    }
  });

  it('every tape event code fits the rail', () => {
    for (const locale of LOCALES) {
      for (const e of DICTS[locale].tape.events) {
        expect(e.code.length).toBeLessThanOrEqual(14);
        expect(e.time).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });
});

describe('narrative consistency', () => {
  it('tape events are in chronological order, matching page order', () => {
    for (const locale of LOCALES) {
      const times = DICTS[locale].tape.events.map((e) => e.time);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('day scenes are in chronological order', () => {
    for (const locale of LOCALES) {
      const times = DICTS[locale].day.scenes.map((s) => s.time);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('the seams anchor the same clock in every locale', () => {
    // The three seams are the page clock's anchors (motion/shift.ts). A time
    // translated differently in one locale would move that locale's ambient light
    // on its own — and if the sequence stopped rising, the clock would read the
    // regression as a second day and run a night through the working day.
    const ru = DICTS.ru.seams;
    for (const locale of LOCALES) {
      const s = DICTS[locale].seams;
      expect([s.day.time, s.night.time, s.dawn.time], locale).toEqual([
        ru.day.time,
        ru.night.time,
        ru.dawn.time,
      ]);
    }
    // day → night rises inside one shift; dawn is the next morning, so it is the
    // one anchor allowed to read as earlier.
    expect(ru.night.time > ru.day.time).toBe(true);
    expect(ru.dawn.time < ru.night.time).toBe(true);
  });

  it('every rule choice has a reply and a saved name', () => {
    for (const locale of LOCALES) {
      const d = DICTS[locale];
      for (const option of d.teach.options) {
        expect(d.teach.savedNames[option.id as 'concise']).toBeTruthy();
        expect(d.client.replies[option.id as 'concise']).toBeTruthy();
        expect(d.client.ruleNames[option.id as 'concise']).toBeTruthy();
      }
    }
  });

  it('the automation tokens reconstruct the instruction word for word', () => {
    // The visitor reads the sentence assembled from the tokens; if the two
    // drift, the page shows a sentence nobody would actually say.
    for (const locale of LOCALES) {
      const d = DICTS[locale];
      const joined = d.automate.tokens.map((t) => t.source).join(' ');
      expect(joined).toBe(d.automate.sentence);
    }
  });

  it('the concise reply really is shorter than the formal one', () => {
    for (const locale of LOCALES) {
      const r = DICTS[locale].client.replies;
      expect(r.concise.length).toBeLessThan(r.formal.length);
    }
  });

  it('handover units carry three plural forms', () => {
    for (const locale of LOCALES) {
      for (const forms of Object.values(DICTS[locale].handover.units)) {
        expect(forms).toHaveLength(3);
      }
    }
  });

  it('keeps the product-truth claims the baseline made', () => {
    // §11 of the baseline: these must not disappear in a redesign.
    expect(ru.hero.proof).toContain('2026');
    expect(ru.boundary.limits.length).toBeGreaterThanOrEqual(4);
    expect(ru.ledger.rows).toHaveLength(5);
    expect(ru.footer.demoNote).toBeTruthy();
    expect(ru.product.demoNote).toBeTruthy();
    expect(ru.boundary.setup).toMatch(/Windows/);
    for (const locale of LOCALES) {
      expect(DICTS[locale].automate.businesses).toHaveLength(4);
      for (const b of DICTS[locale].automate.businesses) expect(b.cases).toHaveLength(3);
      expect(DICTS[locale].ui.graph.data.people.length).toBe(24);
      expect(DICTS[locale].ui.graph.data.projects.length).toBe(12);
      expect(DICTS[locale].ui.vault.rows.length).toBe(10);
    }
  });

  it('has no AI marketing filler', () => {
    const BANNED = [
      /революционн/i,
      /future of work/i,
      /game[- ]?chang/i,
      /cutting[- ]?edge/i,
      /next[- ]?generation/i,
      /искусственный интеллект/i,
      /powered by ai/i,
    ];
    const hits: string[] = [];
    for (const locale of LOCALES) {
      walk(DICTS[locale], locale, (p, text) => {
        if (BANNED.some((re) => re.test(text))) hits.push(`${p}: ${text}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
