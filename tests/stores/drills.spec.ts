import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDrillsStore } from '../../src/stores/drills'

// Use the lightweight Drill from src/types/drills.ts (local store typing)
// We only need the fields that the store requires

type DrillCategory = 'chipping' | 'putting' | 'driving' | 'irons' | 'bunker'
interface Drill {
  id: string
  title: string
  category: DrillCategory
  difficulty?: 1 | 2 | 3 | 4 | 5
  durationMin?: number
  description?: string
  tags?: string[]
  updatedAt: string
}

const makeDrill = (id: string, category: DrillCategory): Drill => ({
  id,
  title: id,
  category,
  updatedAt: new Date().toISOString(),
})

describe('useDrillsStore getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('getById(id) returns the matching drill or undefined', () => {
    const store = useDrillsStore()
    const a = makeDrill('a', 'chipping')
    const b = makeDrill('b', 'putting')
    store.drills = [a, b] as any

    expect(store.getById('a')).toEqual(a)
    expect(store.getById('b')).toEqual(b)
    expect(store.getById('c')).toBeUndefined()
  })

  it('getByCategory(cat) filters by category; undefined/empty returns all', () => {
    const store = useDrillsStore()
    const a = makeDrill('a', 'chipping')
    const b = makeDrill('b', 'putting')
    const c = makeDrill('c', 'chipping')
    store.drills = [a, b, c] as any

    expect(store.getByCategory('chipping')).toEqual([a, c])
    expect(store.getByCategory('putting')).toEqual([b])
    // @ts-expect-error: testing behavior for undefined
    expect(store.getByCategory(undefined)).toEqual([a, b, c])
  })
})
