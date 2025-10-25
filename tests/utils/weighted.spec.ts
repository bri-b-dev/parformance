import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { pickWeighted } from '../../src/utils/weighted'

function makeDeterministicRandom(seed = 42) {
  // Simple LCG for deterministic pseudo‑randoms in [0,1)
  let s = seed >>> 0
  return function rand() {
    // Constants from Numerical Recipes
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const originalRandom = Math.random

describe('utils/pickWeighted', () => {
  beforeEach(() => {
    Math.random = makeDeterministicRandom(123456)
  })
  afterEach(() => {
    Math.random = originalRandom
  })

  it('returns null for empty items', () => {
    expect(pickWeighted([], () => 1)).toBeNull()
  })

  it('falls back to uniform when no weightFn provided', () => {
    const items = ['a', 'b', 'c'] as const
    // With deterministic PRNG, the first call should be stable
    const first = pickWeighted(items as any)
    expect(items.includes(first as any)).toBe(true)
  })

  it('treats non‑positive weights as 0 and falls back to uniform when total == 0', () => {
    const items = ['x', 'y', 'z']
    const counts = { x: 0, y: 0, z: 0 } as Record<string, number>
    for (let i = 0; i < 9000; i++) {
      const picked = pickWeighted(items, () => 0)!
      counts[picked]++
    }
    // Roughly uniform distribution
    const px = counts.x / 9000
    const py = counts.y / 9000
    const pz = counts.z / 9000
    // Each should be around 1/3 with generous tolerance for PRNG variance
    expect(px).toBeGreaterThan(0.25)
    expect(py).toBeGreaterThan(0.25)
    expect(pz).toBeGreaterThan(0.25)
    expect(px).toBeLessThan(0.45)
    expect(py).toBeLessThan(0.45)
    expect(pz).toBeLessThan(0.45)
  })

  it('applies weights: favored item (3x) appears significantly more often (~75%)', () => {
    const items = ['fav', 'other']
    const counts = { fav: 0, other: 0 }
    for (let i = 0; i < 12000; i++) {
      const picked = pickWeighted(items, (it) => (it === 'fav' ? 3 : 1))!
      counts[picked as 'fav' | 'other']++
    }
    const pFav = counts.fav / 12000
    const pOther = counts.other / 12000
    // Expect near 0.75 vs 0.25 with tolerance
    expect(pFav).toBeGreaterThan(0.70)
    expect(pFav).toBeLessThan(0.80)
    expect(pOther).toBeGreaterThan(0.20)
    expect(pOther).toBeLessThan(0.30)
  })

  it('handles negative weights by clamping to 0', () => {
    const items = ['a', 'b']
    // Give a negative weight to 'a' (treated as 0) and positive to 'b'
    // Over many trials, should heavily favor 'b'
    let countB = 0
    for (let i = 0; i < 4000; i++) {
      const picked = pickWeighted(items, (it) => (it === 'a' ? -5 : 2))
      if (picked === 'b') countB++
    }
    const pB = countB / 4000
    expect(pB).toBeGreaterThan(0.8)
  })
})
