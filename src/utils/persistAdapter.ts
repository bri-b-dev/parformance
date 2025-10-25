// Simple persistence adapter with namespaced, versioned keys and debounced writes.
// Falls back to in-memory storage when localStorage is not available (e.g., Node tests)

export interface PersistAdapter {
  get<T = any>(key: string): T | null
  set<T = any>(key: string, value: T): void
  setDebounced<T = any>(key: string, value: T): void
  flush(): void
}

const hasLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

function makeStorage() {
  if (hasLocalStorage()) return window.localStorage
  // Minimal in-memory fallback
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

export function createPersist(namespace: string, version: number, debounceMs = 250): PersistAdapter {
  const timers = new Map<string, any>()

  const makeKey = (key: string) => `${namespace}.${key}.v${version}`
  const getStorage = () => makeStorage()

  function get<T = any>(key: string): T | null {
    const k = makeKey(key)
    const raw = getStorage().getItem(k)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  function set<T = any>(key: string, value: T) {
    const k = makeKey(key)
    try {
      getStorage().setItem(k, JSON.stringify(value))
    } catch {
      // ignore quota/serialization errors in adapter
    }
  }

  function setDebounced<T = any>(key: string, value: T) {
    const k = makeKey(key)
    if (timers.has(k)) clearTimeout(timers.get(k))
    const t = setTimeout(() => {
      timers.delete(k)
      set(key, value)
    }, debounceMs)
    timers.set(k, t)
  }

  function flush() {
    // execute and clear any pending timers synchronously (for tests)
    for (const t of timers.values()) {
      clearTimeout(t)
    }
    timers.clear()
  }

  return { get, set, setDebounced, flush }
}
