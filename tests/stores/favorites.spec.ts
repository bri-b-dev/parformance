import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from '../../src/stores/favorites'

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

describe('useFavoritesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // @ts-expect-error set global window
    global.window = { localStorage: new LocalStorageMock() }
    vi.useFakeTimers()
  })

  it('toggle adds then removes favorite and persists via debounced write', async () => {
    const store = useFavoritesStore()

    await store.load()
    expect(store.list).toEqual([])

    await store.toggle('drill_1')
    // not yet persisted until timers run
    const key = 'parformance.favorites.v1'
    expect(global.window.localStorage.store[key]).toBeUndefined()

    // run timers
    vi.runOnlyPendingTimers()

    expect(JSON.parse(global.window.localStorage.store[key])).toEqual(['drill_1'])

    await store.toggle('drill_1')
    vi.runOnlyPendingTimers()
    expect(JSON.parse(global.window.localStorage.store[key])).toEqual([])
  })
})
