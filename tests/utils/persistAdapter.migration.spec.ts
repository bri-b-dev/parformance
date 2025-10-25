import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPersist } from '../../src/utils/persistAdapter'

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

describe('persistAdapter migration', () => {
  beforeEach(() => {
    // @ts-expect-error assign global
    global.window = { localStorage: new LocalStorageMock() }
    vi.useFakeTimers()
  })

  it('migrates unversioned key to current version (no-op for v1)', () => {
    const ns = 'parformance'
    const key = `${ns}.settings`
    const v1Key = `${ns}.settings.v1`

    const payload = { hcp: 12, handedness: 'left' }
    // seed legacy unversioned entry
    global.window.localStorage.store[key] = JSON.stringify(payload)

    const persist = createPersist(ns, 1)

    const read = persist.get<typeof payload>('settings')
    expect(read).toEqual(payload)

    // should be written to versioned key and legacy removed
    expect(global.window.localStorage.store[v1Key]).toBeTruthy()
    expect(JSON.parse(global.window.localStorage.store[v1Key])).toEqual(payload)
    expect(global.window.localStorage.store[key]).toBeUndefined()
  })

  it('runs custom migrate function when different version is present', () => {
    const ns = 'parformance'
    const legacyKey = `${ns}.favorites.v0`
    const v1Key = `${ns}.favorites.v1`

    const legacyPayload = ['d1', 'd2']
    global.window.localStorage.store[legacyKey] = JSON.stringify(legacyPayload)

    const migrate = (value: any, fromVersion: number | null, toVersion: number) => {
      // verify the adapter passes version info and return transformed value
      expect(fromVersion).toBe(0)
      expect(toVersion).toBe(1)
      return { items: value }
    }

    const persist = createPersist(ns, 1, 10, migrate)
    const read = persist.get<any>('favorites')

    expect(read).toEqual({ items: legacyPayload })
    // Verify it wrote the migrated payload to v1 key and removed legacy
    expect(global.window.localStorage.store[v1Key]).toBeTruthy()
    expect(JSON.parse(global.window.localStorage.store[v1Key])).toEqual({ items: legacyPayload })
    expect(global.window.localStorage.store[legacyKey]).toBeUndefined()
  })
})
