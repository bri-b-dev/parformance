import { describe, it, expect } from 'vitest'
import { getMovingAverageTrend } from '../../src/stats/movingAverage'

describe('moving averages and trend', () => {
  it('returns na when not enough data (<5)', () => {
    expect(getMovingAverageTrend([])).toEqual({ maLast5: null, maPrev5: null, trend: 'na' })
    expect(getMovingAverageTrend([1, 2, 3])).toEqual({ maLast5: null, maPrev5: null, trend: 'na' })
  })

  it('computes maLast5 with exactly 5 values; prev is null and trend na', () => {
    const res = getMovingAverageTrend([1, 2, 3, 4, 5])
    expect(res.maLast5).toBeCloseTo(3)
    expect(res.maPrev5).toBeNull()
    expect(res.trend).toBe('na')
  })

  it('with 9 values still lacks a full previous window; trend na', () => {
    const res = getMovingAverageTrend([1,2,3,4,5,6,7,8,9])
    expect(res.maLast5).toBeCloseTo((5+6+7+8+9)/5)
    expect(res.maPrev5).toBeNull()
    expect(res.trend).toBe('na')
  })

  it('with 10 increasing values → up', () => {
    const res = getMovingAverageTrend([1,2,3,4,5,6,7,8,9,10])
    // last5 avg = 7+8+9+10+6? nope: last 5 are [6,7,8,9,10]
    expect(res.maLast5).toBeCloseTo((6+7+8+9+10)/5)
    expect(res.maPrev5).toBeCloseTo((1+2+3+4+5)/5)
    expect(res.trend).toBe('up')
  })

  it('with 10 decreasing values → down', () => {
    const res = getMovingAverageTrend([10,9,8,7,6,5,4,3,2,1])
    expect(res.maLast5).toBeCloseTo((5+4+3+2+1)/5)
    expect(res.maPrev5).toBeCloseTo((10+9+8+7+6)/5)
    expect(res.trend).toBe('down')
  })

  it('equal window averages → flat', () => {
    const res = getMovingAverageTrend([1,1,1,1,1, 1,1,1,1,1])
    expect(res.maLast5).toBeCloseTo(1)
    expect(res.maPrev5).toBeCloseTo(1)
    expect(res.trend).toBe('flat')
  })

  it('handles non-finite values by ignoring them in windows', () => {
    const res = getMovingAverageTrend([1, 2, NaN as any, 4, 5, Infinity as any, 6, 7, 8, 9])
    // filtered becomes [1,2,4,5,6,7,8,9] (length 8) → not enough for prev window
    expect(res.maPrev5).toBeNull()
    // last5 from filtered are [5,6,7,8,9]
    expect(res.maLast5).toBeCloseTo((5+6+7+8+9)/5)
    expect(res.trend).toBe('na')
  })
})
