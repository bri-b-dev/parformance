import { describe, expect, it } from 'vitest'
import { computeLevelFromThresholds, computeLevelReached } from '@/hcp/level'
import { resolveThresholds } from '@/hcp/buckets'

const targets = { '54-45': [3, 4, 5], '50-20': [7, 8, 9], '25-0': [10, 12, 15] }

describe('resolveThresholds', () => {
  it('picks the narrowest containing bucket', () => {
    expect(resolveThresholds(targets, 22)).toEqual([10, 12, 15]) // inside 50-20 and 25-0 -> 25-0 is narrower
    expect(resolveThresholds(targets, 40)).toEqual([7, 8, 9])
  })
  it('falls back to the nearest bucket for gaps and out-of-range values', () => {
    expect(resolveThresholds({ '54-30': [1, 2, 3], '20-0': [5, 6, 7] }, 24)).toEqual([5, 6, 7])
    expect(resolveThresholds(targets, -2)).toEqual([10, 12, 15])
  })
  it('returns [] without a usable hcp', () => {
    expect(resolveThresholds(targets, null)).toEqual([])
    expect(resolveThresholds(targets, NaN)).toEqual([])
  })
})

describe('computeLevelFromThresholds', () => {
  it('counts thresholds met for greater-is-better', () => {
    const t = [3, 4, 5]
    expect([2, 3, 4, 5, 9].map(v => computeLevelFromThresholds(t, v))).toEqual([0, 1, 2, 3, 3])
  })
  it('counts thresholds met for smaller-is-better', () => {
    const t = [12, 10, 8]
    expect([13, 12, 10, 8, 5].map(v => computeLevelFromThresholds(t, v, true))).toEqual([0, 1, 2, 3, 3])
  })
  it('never grants phantom levels when thresholds are missing', () => {
    expect(computeLevelFromThresholds([10], 11, true)).toBe(0)
    expect(computeLevelFromThresholds([10], 9, true)).toBe(1)
    expect(computeLevelFromThresholds([], 5)).toBe(0)
  })
  it('rejects invalid values', () => {
    expect(computeLevelFromThresholds([1, 2, 3], null)).toBe(0)
    expect(computeLevelFromThresholds([1, 2, 3], NaN)).toBe(0)
  })
})

describe('computeLevelReached', () => {
  it('uses hcp bucket thresholds', () => {
    expect(computeLevelReached(10, targets, 12)).toBe(2)
    expect(computeLevelReached(null, targets, 12)).toBe(0)
  })
})
