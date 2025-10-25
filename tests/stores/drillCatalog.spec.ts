import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDrillCatalogStore } from '../../src/stores/drillCatalog'

// This test ensures that when src/data/drills.json exists, the store returns non-empty drills after load()

describe('useDrillCatalogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns non-empty drills when drills.json is present', async () => {
    const store = useDrillCatalogStore()
    await store.load()
    expect(store.loaded).toBe(true)
    expect(Array.isArray(store.drills)).toBe(true)
    expect(store.drills.length).toBeGreaterThan(0)
  })
})
