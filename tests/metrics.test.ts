import { describe, expect, it } from 'vitest'
import { validateMetricValue } from '@/metrics/validation'
import { computeLevelReached } from '@/hcp/level'

describe('validateMetricValue with range', () => {
  it('enforces explicit bounds', () => {
    expect(validateMetricValue('rating', 'Selbsteinschätzung', 3, [1, 5])).toBeNull()
    expect(validateMetricValue('rating', 'Selbsteinschätzung', 6, [1, 5])).toMatch(/zwischen 1 und 5/)
    expect(validateMetricValue('score', 'Punkte', 0, [0, 15])).toBeNull()
  })
  it('keeps type rules without a range', () => {
    expect(validateMetricValue('streak', 'Serie', 0)).toMatch(/> 0/)
  })
})

describe('self-rating levels', () => {
  it('maps a 1-5 rating to levels', () => {
    const t = { '54-0': [3, 4, 5] }
    expect([2, 3, 4, 5].map(v => computeLevelReached(18, t, v))).toEqual([0, 1, 2, 3])
  })
  it('maps a school grade (1 = best) to levels', () => {
    const t = { '54-0': [4, 3, 2] }
    expect([5, 4, 3, 2, 1].map(v => computeLevelReached(18, t, v, true))).toEqual([0, 1, 2, 3, 3])
  })
})
