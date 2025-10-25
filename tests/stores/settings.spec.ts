import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../src/stores/settings'

class LocalStorageMock {
  store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = value }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
  key(i: number) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

// Minimal jsdom-like globals for CustomEvent dispatch verification
declare global {
  // eslint-disable-next-line no-var
  var window: any
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    // reset pinia and mock storage
    setActivePinia(createPinia())
    // @ts-expect-error assign global
    global.window = {
      localStorage: new LocalStorageMock(),
      dispatchEvent: (evt: Event) => { (global as any).__events?.push?.(evt) },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    ;(global as any).__events = []
    vi.useFakeTimers()
  })

  it('can set and read hcp; persists (debounced) and emits change event when window exists', async () => {
    const store = useSettingsStore()

    const listeners: any[] = (global as any).__events

    expect(store.hcp).toBeNull()

    await store.setHcp(10)

    expect(store.hcp).toBe(10)

    // Debounced persist: nothing yet
    const key = 'parformance.settings.v1'
    expect(global.window.localStorage.store[key]).toBeUndefined()

    // Flush timers to perform write
    vi.runOnlyPendingTimers()

    const storedValue = global.window.localStorage.store[key]
    expect(storedValue).toBeTruthy()
    const parsed = JSON.parse(storedValue as string)
    expect(parsed.hcp).toBe(10)

    // Verify event dispatched
    expect(listeners.length).toBe(1)
    expect((listeners[0] as CustomEvent).type).toBe('hcp-changed')
    expect((listeners[0] as CustomEvent).detail).toBe(10)
  })

  it('load() reads persisted settings', async () => {
    // seed storage
    const key = 'parformance.settings.v1'
    global.window.localStorage.store[key] = JSON.stringify({ hcp: 22, handedness: 'left' })

    const store = useSettingsStore()
    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.hcp).toBe(22)
    expect(store.handedness).toBe('left')
  })

  it('setHandedness() persists value (debounced)', async () => {
    const store = useSettingsStore()
    await store.setHandedness('left')

    // not yet written
    const key = 'parformance.settings.v1'
    expect(global.window.localStorage.store[key]).toBeUndefined()

    vi.runOnlyPendingTimers()

    const storedValue = global.window.localStorage.store[key]
    expect(storedValue).toBeTruthy()
    const parsed = JSON.parse(storedValue as string)
    expect(parsed.handedness).toBe('left')
  })
})
