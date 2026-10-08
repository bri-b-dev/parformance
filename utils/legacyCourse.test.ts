import { describe, it, expect } from 'vitest'
import { parseLegacyCourseName } from './legacyCourse'

describe('parseLegacyCourseName', () => {
  it.each([
    ['72/113', { courseRating: 72, slope: 113 }],
    ['71.4/128', { courseRating: 71.4, slope: 128 }],
    ['71,4/128', { courseRating: 71.4, slope: 128 }],
  ])('parses %s', (name, expected) => {
    expect(parseLegacyCourseName(name)).toEqual(expected)
  })

  it.each(['Golfclub Musterstadt', 'Club A/B', 'Club - Turnier', '', '72/113/5'])(
    'returns null for %j',
    (name) => {
      expect(parseLegacyCourseName(name)).toBeNull()
    }
  )
})
