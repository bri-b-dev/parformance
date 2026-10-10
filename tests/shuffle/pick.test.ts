import { describe, expect, it } from 'vitest'
import { pickRandomDrill } from '@/shuffle/pick'
import type { Drill } from '@/types'

const d = (id: string) => ({ id, title: id }) as Drill
const pool = ['a', 'b', 'c', 'd', 'e'].map(d)
const none = new Set<string>()

describe('pickRandomDrill', () => {
  it('returns null for an empty pool and the only drill for a single one', () => {
    expect(pickRandomDrill([], { recent: [], favorites: none, biasFavorites: false })).toBeNull()
    expect(pickRandomDrill([d('x')], { recent: ['x'], favorites: none, biasFavorites: false })?.id).toBe('x')
  })

  it('avoids recent drills while others remain', () => {
    for (let i = 0; i < 100; i++) {
      const pick = pickRandomDrill(pool, { recent: ['a', 'b', 'c'], favorites: none, biasFavorites: false })!
      expect(['d', 'e']).toContain(pick.id)
    }
  })

  it('falls back to "not the very last pick" when everything was seen', () => {
    for (let i = 0; i < 100; i++) {
      const pick = pickRandomDrill(pool, { recent: ['a', 'b', 'c', 'd', 'e'], favorites: none, biasFavorites: false })!
      expect(pick.id).not.toBe('e')
    }
  })

  it('weights favorites 10x when enabled and equal when not', () => {
    const count = (bias: boolean) => {
      let fav = 0
      const n = 4000
      for (let i = 0; i < n; i++) {
        if (pickRandomDrill(pool, { recent: [], favorites: new Set(['a']), biasFavorites: bias })!.id === 'a') fav++
      }
      return fav / n
    }
    expect(count(true)).toBeGreaterThan(0.6) // 10 / 14 = 0.71
    expect(count(false)).toBeLessThan(0.3) // 1 / 5 = 0.2
  })

  it('uses a smaller factor in tiny pools', () => {
    const tiny = ['a', 'b', 'c'].map(d)
    const rnd = () => 0.6 // total 5 (3 + 1 + 1): 0.6 * 5 = 3 -> falls on "b"
    expect(pickRandomDrill(tiny, { recent: [], favorites: new Set(['a']), biasFavorites: true, rnd })!.id).toBe('b')
  })

  it('is deterministic with an injected random source', () => {
    expect(pickRandomDrill(pool, { recent: [], favorites: none, biasFavorites: false, rnd: () => 0 })!.id).toBe('a')
    expect(pickRandomDrill(pool, { recent: [], favorites: none, biasFavorites: false, rnd: () => 0.99 })!.id).toBe('e')
  })
})
