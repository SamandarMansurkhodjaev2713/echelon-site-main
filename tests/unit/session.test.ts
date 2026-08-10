import { describe, expect, it } from 'vitest';
import {
  createSessionStore,
  formatElapsed,
  EMPTY,
  SESSION_KEY,
  SESSION_MAX_AGE_MS,
  SESSION_VERSION,
} from '../../src/session/state';
import { memoryStorage, readVersioned, writeVersioned } from '../../src/session/storage';

/* A clock we control, so every assertion about elapsed time is exact. */
function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe('session store', () => {
  it('starts empty', () => {
    const s = createSessionStore().get();
    expect(s).toEqual(EMPTY);
    expect(s.rule).toBeNull();
  });

  it('records the taught rule', () => {
    const store = createSessionStore();
    store.teachRule('concise');
    expect(store.get().rule).toBe('concise');
    store.teachRule('formal');
    expect(store.get().rule).toBe('formal');
  });

  it('treats "skip" as a real answer, not an absence', () => {
    const store = createSessionStore();
    store.teachRule('skip');
    expect(store.get().rule).toBe('skip');
  });

  it('is idempotent — scrolling a section twice cannot inflate the report', () => {
    const store = createSessionStore();
    store.remember('actions', 'day-09:00');
    store.remember('actions', 'day-09:00');
    store.remember('actions', 'day-10:00');
    expect(store.get().actions).toEqual(['day-09:00', 'day-10:00']);
  });

  it('keeps the four report buckets separate', () => {
    const store = createSessionStore();
    store.remember('facts', 'alisher');
    store.remember('automations', 'order-018');
    store.remember('actions', 'answered-client');
    store.remember('escalations', 'invoice-214');
    const s = store.get();
    expect([s.facts, s.automations, s.actions, s.escalations].map((a) => a.length)).toEqual([
      1, 1, 1, 1,
    ]);
  });

  it('starts the clock at the first event, not at construction', () => {
    const c = clock();
    const store = createSessionStore({ now: c.now });
    c.advance(30_000);
    expect(store.elapsed()).toBe(0); // nothing has happened yet
    store.remember('actions', 'first');
    c.advance(65_000);
    expect(store.elapsed()).toBe(65);
    expect(formatElapsed(store.elapsed())).toBe('01:05');
  });

  it('notifies subscribers immediately and on every change', () => {
    const store = createSessionStore();
    const seen: Array<string | null> = [];
    const off = store.subscribe((s) => seen.push(s.rule));
    store.teachRule('concise');
    off();
    store.teachRule('formal');
    expect(seen).toEqual([null, 'concise']);
  });

  it('hands subscribers a copy — a caller cannot mutate the store', () => {
    const store = createSessionStore();
    store.remember('facts', 'alisher');
    const snapshot = store.get();
    snapshot.facts.push('injected');
    expect(store.get().facts).toEqual(['alisher']);
  });

  it('reset is deterministic and clears storage', () => {
    const storage = memoryStorage();
    const store = createSessionStore({ storage });
    store.teachRule('concise');
    store.remember('actions', 'x');
    store.reset();
    expect(store.get()).toEqual(EMPTY);
    const store2 = createSessionStore({ storage });
    expect(store2.get().rule).toBeNull();
  });

  it('survives a reload — the language switcher is a real navigation', () => {
    const storage = memoryStorage();
    const c = clock();
    const a = createSessionStore({ storage, now: c.now });
    a.teachRule('concise');
    a.remember('facts', 'alisher');

    // simulates landing on /en/ a moment later
    c.advance(4_000);
    const b = createSessionStore({ storage, now: c.now });
    expect(b.get().rule).toBe('concise');
    expect(b.get().facts).toEqual(['alisher']);
  });

  it('starts clean once the session is stale', () => {
    const storage = memoryStorage();
    const c = clock();
    createSessionStore({ storage, now: c.now }).teachRule('concise');
    c.advance(SESSION_MAX_AGE_MS + 1);
    expect(createSessionStore({ storage, now: c.now }).get().rule).toBeNull();
  });

  it('ignores a record written by an older schema', () => {
    const storage = memoryStorage();
    writeVersioned(storage, SESSION_KEY, SESSION_VERSION - 1, { rule: 'concise' }, Date.now());
    expect(createSessionStore({ storage }).get().rule).toBeNull();
  });

  it('ignores corrupt or hostile storage contents', () => {
    const storage = memoryStorage();
    storage.write(SESSION_KEY, '{not json');
    expect(createSessionStore({ storage }).get()).toEqual(EMPTY);

    writeVersioned(
      storage,
      SESSION_KEY,
      SESSION_VERSION,
      { rule: 'DROP TABLE', facts: 'not-an-array', actions: [1, 2, {}] },
      Date.now(),
    );
    const s = createSessionStore({ storage }).get();
    expect(s.rule).toBeNull();
    expect(s.facts).toEqual([]);
    expect(s.actions).toEqual([]);
  });

  it('never throws when storage itself throws', () => {
    const hostile = {
      read: () => {
        throw new Error('blocked');
      },
      write: () => {
        throw new Error('blocked');
      },
      remove: () => {
        throw new Error('blocked');
      },
    };
    // private-browsing style storage: the feature degrades, it does not break
    let store!: ReturnType<typeof createSessionStore>;
    expect(() => {
      store = createSessionStore({ storage: hostile });
      store.teachRule('concise');
      store.remember('actions', 'x');
      store.reset();
    }).not.toThrow();
    // and it still works in memory for the rest of the visit
    store.teachRule('formal');
    expect(store.get().rule).toBe('formal');
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'],
    [9, '00:09'],
    [60, '01:00'],
    [278, '04:38'],
    [3599, '59:59'],
    [-5, '00:00'],
  ])('%i s → %s', (input, expected) => {
    expect(formatElapsed(input)).toBe(expected);
  });
});

describe('versioned storage', () => {
  it('round-trips within the freshness window', () => {
    const storage = memoryStorage();
    writeVersioned(storage, 'k', 1, { a: 1 }, 1000);
    expect(readVersioned(storage, 'k', 1, 5000, 3000)).toEqual({ a: 1 });
  });

  it('drops the record once it is stale and does not read it twice', () => {
    const storage = memoryStorage();
    writeVersioned(storage, 'k', 1, { a: 1 }, 1000);
    expect(readVersioned(storage, 'k', 1, 500, 3000)).toBeNull();
    expect(storage.read('k')).toBeNull();
  });
});
