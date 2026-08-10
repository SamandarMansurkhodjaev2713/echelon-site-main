import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DURATION, EASE, STAGGER, dur, ease } from '../../src/motion/tokens';
import { PATTERNS } from '../../src/motion/reveal';
import { CURSOR_STATES, resolveState } from '../../src/motion/cursor';
import { plural } from '../../src/i18n';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('motion tokens', () => {
  it('keeps the vocabulary small (§29: not twenty easings)', () => {
    expect(Object.keys(DURATION)).toHaveLength(4);
    expect(Object.keys(EASE)).toHaveLength(5);
    expect(Object.keys(STAGGER)).toHaveLength(3);
  });

  it('durations sit inside the bands the brief specifies', () => {
    expect(dur('fast') * 1000).toBeGreaterThanOrEqual(100);
    expect(dur('fast') * 1000).toBeLessThanOrEqual(300);
    expect(dur('normal') * 1000).toBeGreaterThanOrEqual(200);
    expect(dur('normal') * 1000).toBeLessThanOrEqual(500);
    expect(dur('expressive') * 1000).toBeGreaterThanOrEqual(400);
    expect(dur('expressive') * 1000).toBeLessThanOrEqual(900);
  });

  it('durations increase monotonically', () => {
    const values = Object.values(DURATION);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('every easing is a valid cubic-bezier', () => {
    for (const name of Object.keys(EASE) as Array<keyof typeof EASE>) {
      expect(ease(name)).toMatch(/^cubic-bezier\(-?[\d.]+, -?[\d.]+, -?[\d.]+, -?[\d.]+\)$/);
    }
  });

  it('only "snap" is allowed to overshoot', () => {
    const overshoots = (v: string) =>
      v
        .replace(/cubic-bezier\(|\)/g, '')
        .split(',')
        .map(Number)
        .filter((_, i) => i % 2 === 1)
        .some((y) => y > 1 || y < 0);
    for (const [name, value] of Object.entries(EASE)) {
      expect(`${name}:${overshoots(value)}`).toBe(`${name}:${name === 'snap'}`);
    }
  });

  /* The JS tokens and the CSS custom properties are two copies of one decision.
     If they drift, GSAP-free scenes and CSS transitions stop agreeing. */
  it('is mirrored exactly into styles/tokens.css', () => {
    const css = read('src/styles/tokens.css');
    for (const [name, seconds] of Object.entries(DURATION)) {
      expect(css).toContain(`--dur-${name}: ${Math.round(seconds * 1000)}ms;`);
    }
    for (const [name, curve] of Object.entries(EASE)) {
      expect(css).toContain(`--ease-${name}: ${curve};`);
    }
  });
});

describe('reveal patterns', () => {
  it('defines exactly the six named behaviours', () => {
    expect([...PATTERNS]).toEqual([
      'receive',
      'resolve',
      'archive',
      'escalate',
      'expand',
      'handover',
    ]);
  });

  it('every pattern has a rule in base.css', () => {
    const css = read('src/styles/base.css');
    for (const p of PATTERNS) {
      expect(css).toContain(`[data-reveal='${p}']`);
    }
  });

  it('reduced motion neutralises transform and clip-path', () => {
    const css = read('src/styles/base.css');
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toContain('transform: none !important');
    expect(block).toContain('clip-path: none !important');
    expect(block).toContain('opacity: 1 !important');
  });

  it('components only use patterns that exist', () => {
    const dir = 'src/components';
    const used = new Set<string>();
    const scan = (d: string) => {
      for (const entry of fs.readdirSync(path.join(process.cwd(), d), { withFileTypes: true })) {
        const rel = `${d}/${entry.name}`;
        if (entry.isDirectory()) scan(rel);
        else if (entry.name.endsWith('.astro')) {
          for (const m of read(rel).matchAll(/data-reveal="([a-z]+)"/g)) used.add(m[1]!);
        }
      }
    };
    scan(dir);
    expect(used.size).toBeGreaterThan(0);
    for (const p of used) expect(PATTERNS).toContain(p as (typeof PATTERNS)[number]);
  });
});

describe('cursor state machine', () => {
  it('declares the nine semantic states', () => {
    expect(CURSOR_STATES).toHaveLength(9);
    expect(CURSOR_STATES).toContain('approve');
    expect(CURSOR_STATES).toContain('speak');
  });

  it('resolves the nearest declaring ancestor', () => {
    const outer = { dataset: { cursor: 'open' } } as unknown as HTMLElement;
    const target = {
      closest: (sel: string) => (sel === '[data-cursor]' ? outer : null),
    } as unknown as Element;
    expect(resolveState(target).state).toBe('open');
  });

  it('falls back to default for unknown or absent values', () => {
    const bogus = {
      closest: () => ({ dataset: { cursor: 'explode' } }) as unknown as HTMLElement,
    } as unknown as Element;
    expect(resolveState(bogus).state).toBe('default');
    expect(resolveState(null).state).toBe('default');
    expect(resolveState({ closest: () => null } as unknown as Element).state).toBe('default');
  });

  it('every state has styling', () => {
    const css = read('src/styles/base.css');
    expect(css).toContain('.cursor');
    expect(css).toContain("[data-state='approve']");
    expect(css).toContain('pointer-events: none');
  });
});

describe('plural resolver', () => {
  const forms = ['запись', 'записи', 'записей'];

  it.each([
    [1, 'запись'],
    [2, 'записи'],
    [4, 'записи'],
    [5, 'записей'],
    [11, 'записей'],
    [12, 'записей'],
    [14, 'записей'],
    [21, 'запись'],
    [22, 'записи'],
    [25, 'записей'],
    [111, 'записей'],
    [0, 'записей'],
  ])('ru %i → %s', (n, expected) => {
    expect(plural('ru', n, forms)).toBe(expected);
  });

  it('english uses two forms', () => {
    expect(plural('en', 1, ['record', 'records', 'records'])).toBe('record');
    expect(plural('en', 0, ['record', 'records', 'records'])).toBe('records');
    expect(plural('en', 5, ['record', 'records', 'records'])).toBe('records');
  });

  it('uzbek does not inflect after a numeral', () => {
    for (const n of [1, 2, 5, 21]) {
      expect(plural('uz', n, ['yozuv', 'yozuv', 'yozuv'])).toBe('yozuv');
    }
  });
});

describe('scroll scrubber', () => {
  it('has no GSAP import anywhere in src/', () => {
    // §44: two scrubbed scenes did not justify a 46 KB gzipped engine.
    const offenders: string[] = [];
    const scan = (d: string) => {
      for (const entry of fs.readdirSync(path.join(process.cwd(), d), { withFileTypes: true })) {
        const rel = `${d}/${entry.name}`;
        if (entry.isDirectory()) scan(rel);
        else if (/\.(ts|astro|mjs)$/.test(entry.name) && /from ['"]gsap/.test(read(rel))) {
          offenders.push(rel);
        }
      }
    };
    scan('src');
    expect(offenders).toEqual([]);
  });

  it('is not declared as a dependency', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies.gsap).toBeUndefined();
  });
});
