import { setActivePinia, createPinia } from 'pinia'
import { config } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'
import { i18n } from '@/i18n'
import { cancelAllPendingWrites } from '@/utils/persistAdapter'

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
  // jsdom does not implement scrolling; components call it on mount
  vi.stubGlobal('scrollTo', () => {})
  // diagrams and thumbnails fetch SVGs: never hit the network from tests
  vi.stubGlobal('fetch', async () => ({ ok: false, status: 404, text: async () => '', headers: new Headers() }))
  vi.stubGlobal('localStorage', memoryStorage())
  setActivePinia(createPinia())
})

// debounced store writes still waiting when a test ends must not land in the next test's storage
afterEach(() => cancelAllPendingWrites())

// components use $t(): every mount gets the app's i18n (German by default)
config.global.plugins = [i18n]
