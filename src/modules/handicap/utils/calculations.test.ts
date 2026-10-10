import { describe, it, expect } from 'vitest'
import { computeBaseHandicap, applyCap } from './calculations'

// consecutive differentials starting at 10, already sorted ascending
const seq = (n: number) => Array.from({ length: n }, (_, i) => 10 + i)

describe('computeBaseHandicap', () => {
  it('returns 0 without rounds', () => {
    expect(computeBaseHandicap([])).toBe(0)
  })

  it.each([
    // [rounds, expected HI]
    [1, 8.0], // best 1, -2.0
    [3, 8.0], // best 1, -2.0
    [4, 9.0], // best 1, -1.0
    [5, 10.0], // best 1
    [6, 9.5], // best 2 (10, 11), -1.0
    [7, 10.5], // best 2
    [8, 10.5],
    [9, 11.0], // best 3
    [11, 11.0],
    [12, 11.5], // best 4
    [14, 11.5],
    [15, 12.0], // best 5
    [16, 12.0],
    [17, 12.5], // best 6
    [18, 12.5],
    [19, 13.0], // best 7
    [20, 13.5], // best 8
  ])('uses the WHS table for %i rounds', (n, expected) => {
    expect(computeBaseHandicap(seq(n))).toBe(expected)
  })

  it('rounds to one decimal', () => {
    // best 3 of 9: (10.1 + 10.2 + 10.4) / 3 = 10.2333
    expect(computeBaseHandicap([10.1, 10.2, 10.4, 11, 12, 13, 14, 15, 16])).toBe(10.2)
  })

  describe('previous HI cap (26.5 - 54)', () => {
    it('caps an increase when prevHC >= 26.5', () => {
      expect(computeBaseHandicap([35], 30)).toBe(30)
    })

    it('does not cap when prevHC < 26.5', () => {
      expect(computeBaseHandicap([35], 20)).toBe(33)
    })

    it('does not raise a lower result', () => {
      expect(computeBaseHandicap([20], 30)).toBe(18)
    })
  })
})

describe('applyCap', () => {
  const rec = (date: string, storedHandicap: number) => ({ date, storedHandicap })

  it('returns newHC when there are no past rounds', () => {
    expect(applyCap(12, [rec('2025-06-01', 0)], 0)).toBe(12)
  })

  it('returns newHC when increase is within +3.0', () => {
    const records = [rec('2025-01-01', 10), rec('2025-06-01', 0)]
    expect(applyCap(13, records, 1)).toBe(13)
  })

  it('halves the increase beyond +3.0 (soft cap)', () => {
    const records = [rec('2025-01-01', 10), rec('2025-06-01', 0)]
    // diff 5 -> 3 + 2/2 = 4
    expect(applyCap(15, records, 1)).toBe(14)
  })

  it('limits the increase to +5.0 (hard cap)', () => {
    const records = [rec('2025-01-01', 10), rec('2025-06-01', 0)]
    // diff 10 -> soft 6.5 > 5
    expect(applyCap(20, records, 1)).toBe(15)
  })

  it('ignores rounds older than 365 days', () => {
    const records = [rec('2023-01-01', 5), rec('2025-06-01', 0)]
    expect(applyCap(12, records, 1)).toBe(12)
  })

  it('uses the lowest HI of the past 365 days', () => {
    const records = [rec('2025-01-01', 10), rec('2025-03-01', 8), rec('2025-06-01', 0)]
    // low 8, new 15: diff 7 -> 3 + 2 = 5 -> 13
    expect(applyCap(15, records, 2)).toBe(13)
  })
})
