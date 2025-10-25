import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionsStore } from '../../src/stores/sessions'

class LocalStorageMock {
  store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = value }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
  key(i: number) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

declare global { var window: any }

describe('useSessionsStore persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // @ts-expect-error set global window
    global.window = { localStorage: new LocalStorageMock(), crypto: { randomUUID: () => 'uuid-1' } }
    vi.useFakeTimers()
  })

  it('addSession persists via debounced write and load() hydrates', async () => {
    const store = useSessionsStore()

    await store.load()
    expect(store.loaded).toBe(true)
    expect(store.sessions).toEqual([])

    await store.addSession({ drillId: 'd1', date: '2025-01-01T00:00:00Z', hcp: 10, result: { value: 1, unit: 'pts' } })

    const key = 'parformance.sessions.v1'
    // Not written yet
    expect(global.window.localStorage.store[key]).toBeUndefined()

    // run timers for debounced persist
    vi.runOnlyPendingTimers()

    const saved = JSON.parse(global.window.localStorage.store[key])
    expect(saved.length).toBe(1)
    expect(saved[0].drillId).toBe('d1')

    // New store should hydrate from storage
    const store2 = useSessionsStore()
    await store2.load()
    expect(store2.sessions.length).toBe(1)
    expect(store2.sessions[0].drillId).toBe('d1')
  })
})
