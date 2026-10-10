import { describe, expect, it } from 'vitest'
import { buildScale } from '@/hcp/scale'

describe('buildScale (greater is better)', () => {
  const base = { thresholds: [4, 6, 9], smallerIsBetter: false }

  it('places the markers in order from left to right inside 0..1', () => {
    const m = buildScale({ ...base, best: null, last: null })!
    expect(m.markers.map(x => x.level)).toEqual([1, 2, 3])
    expect(m.markers.map(x => x.value)).toEqual([4, 6, 9])
    const pos = m.markers.map(x => x.pos)
    expect(pos[0]).toBeGreaterThan(0)
    expect(pos[0]).toBeLessThan(pos[1])
    expect(pos[1]).toBeLessThan(pos[2])
    expect(pos[2]).toBeLessThanOrEqual(1)
    expect(m.bestPos).toBeNull()
    expect(m.level).toBe(0)
  })

  it('reports the next level and the distance from the best result', () => {
    const m = buildScale({ ...base, best: 5, last: 3 })!
    expect(m.level).toBe(1)
    expect(m.next).toEqual({ level: 2, value: 6, gap: 1 })
    expect(m.bestPos!).toBeGreaterThan(m.markers[0].pos)
    expect(m.bestPos!).toBeLessThan(m.markers[1].pos)
    expect(m.lastPos!).toBeLessThan(m.bestPos!)
  })

  it('has no next level at the top and keeps results beyond the top on the scale', () => {
    const m = buildScale({ ...base, best: 12, last: 12 })!
    expect(m.level).toBe(3)
    expect(m.next).toBeNull()
    expect(m.bestPos).toBeLessThanOrEqual(1)
    expect(m.markers[2].pos).toBeLessThan(m.bestPos!)
  })

  it('without a result the next step is the first level', () => {
    const m = buildScale({ ...base, best: null, last: null })!
    expect(m.next).toMatchObject({ level: 1, value: 4 })
  })
})

describe('buildScale (smaller is better)', () => {
  const base = { thresholds: [30, 27, 24], smallerIsBetter: true }

  it('mirrors the scale so that better results are on the right', () => {
    const m = buildScale({ ...base, best: null, last: null })!
    expect(m.markers.map(x => x.value)).toEqual([30, 27, 24])
    const pos = m.markers.map(x => x.pos)
    expect(pos[0]).toBeLessThan(pos[1])
    expect(pos[1]).toBeLessThan(pos[2])
  })

  it('computes level and distance downwards', () => {
    const m = buildScale({ ...base, best: 28, last: 31 })!
    expect(m.level).toBe(1)
    expect(m.next).toEqual({ level: 2, value: 27, gap: 1 })
    expect(m.lastPos!).toBeLessThan(m.bestPos!)
    expect(buildScale({ ...base, best: 22, last: 22 })!.next).toBeNull()
  })

  it('handles results worse than the first threshold and negative thresholds', () => {
    const worse = buildScale({ ...base, best: 40, last: 40 })!
    expect(worse.level).toBe(0)
    expect(worse.bestPos).toBe(0)
    const par = buildScale({ thresholds: [2, 0, -2], smallerIsBetter: true, best: 1, last: 1 })!
    expect(par.level).toBe(1)
    expect(par.next).toEqual({ level: 2, value: 0, gap: 1 })
    expect(par.markers[0].pos).toBeLessThan(par.markers[2].pos)
  })
})

describe('buildScale edge cases', () => {
  it('returns null without thresholds and ignores non-finite ones', () => {
    expect(buildScale({ thresholds: [], smallerIsBetter: false, best: 1, last: 1 })).toBeNull()
    expect(buildScale({ thresholds: [NaN], smallerIsBetter: false, best: null, last: null })).toBeNull()
  })
  it('works with a single threshold', () => {
    const m = buildScale({ thresholds: [5], smallerIsBetter: false, best: 5, last: 5 })!
    expect(m.maxLevel).toBe(1)
    expect(m.level).toBe(1)
    expect(m.next).toBeNull()
  })
  it('keeps every position inside 0..1', () => {
    for (const best of [-50, 0, 3, 100]) {
      const m = buildScale({ thresholds: [4, 6, 9], smallerIsBetter: false, best, last: best })!
      for (const p of [m.bestPos!, m.lastPos!, ...m.markers.map(x => x.pos)]) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })
})
