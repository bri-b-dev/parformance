import { describe, it, expect } from 'vitest'
import { filterDrills } from '../../src/filters/drills'
import drills from '../../src/data/drills.json'

// Snapshot tests for filtering behavior (Definition of Done)
// We snapshot the resulting drill IDs for various filter combinations.

describe('filterDrills', () => {
  it('no filters returns all', () => {
    const res = filterDrills(drills as any, {})
    expect(res.map(d => d.id)).toMatchSnapshot()
  })

  it('filters by category', () => {
    const res = filterDrills(drills as any, { category: 'Chipping Green' })
    expect(res.map(d => d.id)).toMatchSnapshot()
  })

  it('search by title (case-insensitive)', () => {
    const res = filterDrills(drills as any, { query: 'carry' })
    expect(res.map(d => d.id)).toMatchSnapshot()
  })

  it('favorites only', () => {
    const res = filterDrills(drills as any, { onlyFavorites: true, favorites: ['chip_carry_zone'] })
    expect(res.map(d => d.id)).toMatchSnapshot()
  })

  it('combined: category + favorites + query', () => {
    const res = filterDrills(drills as any, {
      category: 'Chipping Green',
      onlyFavorites: true,
      favorites: ['chip_carry_zone', 'range_14_fairways'],
      query: 'carry',
    })
    expect(res.map(d => d.id)).toMatchSnapshot()
  })
})
