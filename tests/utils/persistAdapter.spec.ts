import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPersist } from '../../src/utils/persistAdapter'

// Mock localStorage
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

describe('persistAdapter', () => {
  beforeEach(() => {
    // @ts-expect-error set global window
    global.window = { localStorage: new LocalStorageMock() }
    vi.useFakeTimers()
  })

  it('uses namespaced, versioned keys and debounces writes', () => {
    const p = createPersist('parformance', 2, 200)

    // schedule two writes quickly; only last should stick after timers run
    p.setDebounced('sessions', [{ id: 'a' }])
    p.setDebounced('sessions', [{ id: 'b' }])

    // nothing written yet before timers
    const ls = global.window.localStorage as LocalStorageMock
    expect(Object.keys(ls.store).length).toBe(0)

    // advance timers
    vi.advanceTimersByTime(200)

    const key = 'parformance.sessions.v2'
    expect(ls.store[key]).toBeTruthy()
    expect(JSON.parse(ls.store[key])).toEqual([{ id: 'b' }])
  })
})
