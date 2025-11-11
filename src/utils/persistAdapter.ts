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

export function createPersist(
  namespace: string,
  version: number,
  debounceMs = 250,
  migrateFn?: (value: any, fromVersion: number | null, toVersion: number) => any
): PersistAdapter {
  const timers = new Map<string, any>()

  const makeKey = (key: string, ver: number = version) => `${namespace}.${key}.v${ver}`
  const getStorage = () => makeStorage()

  function findLegacyKey(baseKey: string): { key: string; fromVersion: number | null } | null {
    const storage = getStorage()
    const legacyUnversioned = `${namespace}.${baseKey}`
    // Prefer exact unversioned key first
    if (storage.getItem(legacyUnversioned) != null) {
      return { key: legacyUnversioned, fromVersion: null }
    }
    // Then search for same namespace/key with any version other than current
    const prefix = `${namespace}.${baseKey}.v`
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (!k) continue
      if (k.startsWith(prefix)) {
        const verStr = k.slice(prefix.length)
        const fromVersion = Number.isFinite(Number(verStr)) ? Number(verStr) : null
        if (fromVersion !== version) {
          return { key: k, fromVersion }
        }
      }
    }
    return null
  }

  function migrateIfNeeded<T = any>(baseKey: string): T | null {
    const storage = getStorage()
    const legacy = findLegacyKey(baseKey)
    if (!legacy) return null
    const raw = storage.getItem(legacy.key)
    if (!raw) return null
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      // cannot parse legacy, drop it
      storage.removeItem(legacy.key)
      return null
    }
    const migrator = migrateFn ?? ((v: any) => v)
    const migrated = migrator(parsed, legacy.fromVersion, version)
    try {
      storage.setItem(makeKey(baseKey), JSON.stringify(migrated))
      // remove legacy after successful write
      storage.removeItem(legacy.key)
    } catch {
      // ignore write errors, keep legacy
    }
    return migrated as T
  }

  function get<T = any>(key: string): T | null {
    const k = makeKey(key)
    const storage = getStorage()
    let raw = storage.getItem(k)
    if (!raw) {
      // Try migrate from legacy/unversioned/other-version
      const migrated = migrateIfNeeded<T>(key)
      if (migrated != null) return migrated
      return null
    }
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
