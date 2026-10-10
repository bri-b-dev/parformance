import { describe, expect, it } from 'vitest'
import { useCollectionsStore } from '@/stores/collections'
import { createPinia, setActivePinia } from 'pinia'

describe('collections store', () => {
  it('adds, orders, updates and removes collections and persists them', async () => {
    const s = useCollectionsStore()
    const c = s.add({ name: '  Vor der Runde  ', drillIds: ['a', 'b', 'a', 'c'], icon: '⛳' })!
    expect(c.name).toBe('Vor der Runde')
    expect(c.drillIds).toEqual(['a', 'b', 'c'])
    expect(s.update(c.id, { drillIds: ['c', 'a'] })).toBe(true)
    expect(s.byId(c.id)!.drillIds).toEqual(['c', 'a'])

    setActivePinia(createPinia())
    const fresh = useCollectionsStore()
    await fresh.load()
    expect(fresh.items).toHaveLength(1)
    expect(fresh.items[0].drillIds).toEqual(['c', 'a'])
    expect(fresh.items[0].icon).toBe('⛳')

    fresh.remove(c.id)
    expect(fresh.items).toEqual([])
  })

  it('rejects empty names and unknown ids', () => {
    const s = useCollectionsStore()
    expect(s.add({ name: '   ', drillIds: ['a'] })).toBeNull()
    expect(s.update('nope', { name: 'x' })).toBe(false)
    expect(s.update('nope', { name: '' })).toBe(false)
  })

  it('sanitizes imported data', () => {
    const s = useCollectionsStore()
    s.replaceAll([{ name: 'Ok', drillIds: ['a', 5, null, 'a'] }, { name: '', drillIds: [] }, 'x', null, { drillIds: ['z'] }])
    expect(s.items).toHaveLength(1)
    expect(s.items[0].drillIds).toEqual(['a'])
    expect(s.items[0].id).toBeTruthy()
    s.clearAll()
    expect(s.items).toEqual([])
  })
})
