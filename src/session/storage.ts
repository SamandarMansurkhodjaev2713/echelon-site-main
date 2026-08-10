/*
 * Versioned, failure-tolerant storage.
 *
 * Why sessionStorage and not localStorage: the language switcher is a real
 * navigation (RU/EN/UZ are separate pages), so narrative state has to survive a
 * page load or switching language mid-visit would silently erase what the
 * visitor taught the page. sessionStorage gives that continuity while still
 * ending when the tab does — a returning visitor tomorrow gets a clean session
 * instead of a shift report they do not remember producing.
 *
 * Nothing here leaves the browser. No network, no identifiers, no tracking.
 */

export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

/** Storage can throw (private mode, disabled cookies, quota). Never let it. */
export function browserStorage(kind: 'session' | 'local' = 'session'): StorageAdapter {
  const store = () => (kind === 'session' ? window.sessionStorage : window.localStorage);
  return {
    read(key) {
      try {
        return store().getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      try {
        store().setItem(key, value);
      } catch {
        /* full or unavailable — the session simply becomes non-persistent */
      }
    },
    remove(key) {
      try {
        store().removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** In-memory adapter — used by unit tests and as the fallback when storage throws. */
export function memoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    read: (k) => map.get(k) ?? null,
    write: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

export interface Versioned<T> {
  v: number;
  at: number;
  data: T;
}

/**
 * Read a versioned record. Returns null when absent, corrupt, from a previous
 * schema version, or older than `maxAgeMs`.
 */
export function readVersioned<T>(
  storage: StorageAdapter,
  key: string,
  version: number,
  maxAgeMs: number,
  now: number,
): T | null {
  const raw = storage.read(key);
  if (!raw) return null;
  let parsed: Versioned<T>;
  try {
    parsed = JSON.parse(raw) as Versioned<T>;
  } catch {
    storage.remove(key);
    return null;
  }
  if (!parsed || parsed.v !== version || typeof parsed.at !== 'number') {
    storage.remove(key);
    return null;
  }
  if (now - parsed.at > maxAgeMs) {
    storage.remove(key);
    return null;
  }
  return parsed.data;
}

export function writeVersioned<T>(
  storage: StorageAdapter,
  key: string,
  version: number,
  data: T,
  now: number,
): void {
  storage.write(key, JSON.stringify({ v: version, at: now, data } satisfies Versioned<T>));
}
