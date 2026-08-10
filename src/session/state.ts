/*
 * Narrative session state — the page's own memory of this visit.
 *
 * This is the mechanism behind the site's central claim: it remembers what you
 * told it, keeps quiet about it for several sections, and then uses it. Purely
 * local, purely frontend, no identifiers, nothing sent anywhere.
 *
 * The store is a pure module with an injectable clock and storage adapter so
 * every transition is unit-testable and every reset is deterministic (§35).
 */

import {
  browserStorage,
  memoryStorage,
  readVersioned,
  writeVersioned,
  type StorageAdapter,
} from './storage';

export const SESSION_KEY = 'echelon_session_v1';
export const SESSION_VERSION = 1;
/** A visit, generously. Beyond this the session is stale and starts clean. */
export const SESSION_MAX_AGE_MS = 90 * 60 * 1000;

/** The rule the visitor can teach. `none` is a real answer, not an absence. */
export type RuleChoice = 'concise' | 'formal' | 'skip';

export interface SessionState {
  /** ms epoch of the first event in this session */
  startedAt: number;
  /** the rule the visitor taught, or null if they have not chosen yet */
  rule: RuleChoice | null;
  /** business entities the page has surfaced to this visitor, in order */
  facts: string[];
  /** automations the visitor watched being created */
  automations: string[];
  /** operations completed in front of them */
  actions: string[];
  /** decisions handed back to the owner */
  escalations: string[];
}

export const EMPTY: SessionState = {
  startedAt: 0,
  rule: null,
  facts: [],
  automations: [],
  actions: [],
  escalations: [],
};

type Listener = (state: SessionState) => void;

export interface SessionStore {
  get(): SessionState;
  subscribe(fn: Listener): () => void;
  teachRule(rule: RuleChoice): void;
  remember(kind: 'facts' | 'automations' | 'actions' | 'escalations', id: string): void;
  /** elapsed session time in seconds, 0 when nothing has happened yet */
  elapsed(): number;
  reset(): void;
}

export interface StoreOptions {
  storage?: StorageAdapter;
  now?: () => number;
}

const clone = (s: SessionState): SessionState => ({
  ...s,
  facts: [...s.facts],
  automations: [...s.automations],
  actions: [...s.actions],
  escalations: [...s.escalations],
});

/** Accept only shapes we wrote ourselves; anything else starts clean. */
function sanitise(raw: unknown): SessionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SessionState>;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const rule =
    r.rule === 'concise' || r.rule === 'formal' || r.rule === 'skip' ? r.rule : null;
  return {
    startedAt: typeof r.startedAt === 'number' ? r.startedAt : 0,
    rule,
    facts: list(r.facts),
    automations: list(r.automations),
    actions: list(r.actions),
    escalations: list(r.escalations),
  };
}

export function createSessionStore(opts: StoreOptions = {}): SessionStore {
  const storage = opts.storage ?? memoryStorage();
  const now = opts.now ?? (() => Date.now());

  const restore = (): SessionState | null => {
    try {
      return sanitise(
        readVersioned<SessionState>(
          storage,
          SESSION_KEY,
          SESSION_VERSION,
          SESSION_MAX_AGE_MS,
          now(),
        ),
      );
    } catch {
      return null;
    }
  };

  let state: SessionState = restore() ?? clone(EMPTY);

  const listeners = new Set<Listener>();

  const commit = (next: SessionState) => {
    state = next;
    // Persistence is best-effort. A storage failure (quota, private mode, a
    // policy-blocked adapter) must degrade the session to memory-only — it must
    // never surface as a broken button.
    try {
      writeVersioned(storage, SESSION_KEY, SESSION_VERSION, state, now());
    } catch {
      /* memory-only for the rest of the visit */
    }
    for (const fn of listeners) fn(clone(state));
  };

  const touchStart = (s: SessionState) =>
    s.startedAt === 0 ? { ...s, startedAt: now() } : s;

  return {
    get: () => clone(state),

    subscribe(fn) {
      listeners.add(fn);
      fn(clone(state));
      return () => void listeners.delete(fn);
    },

    teachRule(rule) {
      if (state.rule === rule) return;
      commit({ ...touchStart(state), rule });
    },

    remember(kind, id) {
      if (state[kind].includes(id)) return; // idempotent — scrolling back must not inflate counts
      const next = touchStart(state);
      commit({ ...next, [kind]: [...next[kind], id] });
    },

    elapsed() {
      return state.startedAt === 0 ? 0 : Math.max(0, Math.floor((now() - state.startedAt) / 1000));
    },

    reset() {
      try {
        storage.remove(SESSION_KEY);
      } catch {
        /* the in-memory reset below is the part that must always happen */
      }
      commit(clone(EMPTY));
    },
  };
}

/** mm:ss for the handover header. */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ---------------------------------------------------------------------------
 * Browser singleton
 * ------------------------------------------------------------------------ */

let singleton: SessionStore | null = null;

export function session(): SessionStore {
  if (!singleton) {
    const params = new URLSearchParams(window.location.search);
    const store = createSessionStore({ storage: browserStorage('session') });
    // Deterministic reset for tests and for anyone who wants a clean run (§35).
    // The flag is consumed immediately and removed from the URL: left in place
    // it would re-fire on every reload and on every Back, quietly wiping a
    // session the visitor was in the middle of.
    if (params.get('session') === 'reset') {
      store.reset();
      params.delete('session');
      const query = params.toString();
      history.replaceState(
        history.state,
        '',
        window.location.pathname + (query ? `?${query}` : '') + window.location.hash,
      );
    }
    singleton = store;
    // E2E hook: assert state without reaching into storage internals.
    (window as unknown as { __echelon?: Record<string, unknown> }).__echelon = {
      ...(window as unknown as { __echelon?: Record<string, unknown> }).__echelon,
      session: store,
    };
  }
  return singleton;
}

/** Test-only: drop the singleton so the next session() rebuilds from storage. */
export function __resetSingleton(): void {
  singleton = null;
}
