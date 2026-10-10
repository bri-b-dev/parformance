import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// Newer Node versions ship an experimental global `localStorage` that shadows jsdom's and is
// undefined without a backing file, so install a small in-memory Storage for deterministic tests.
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => { m.delete(k) },
    setItem: (k, v) => { m.set(k, String(v)) },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  setActivePinia(createPinia())
})
