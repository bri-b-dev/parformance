import { computeStreaks } from '../../src/utils/streaks'

import { describe, test, expect } from 'vitest'

describe('computeStreaks', () => {
  test('gap day resets streak and best preserved', () => {
    const sessions = [
      { date: '2025-01-01T10:00:00Z' },
      { date: '2025-01-02T11:00:00Z' },
      { date: '2025-01-03T09:00:00Z' },
      // gap on 2025-01-04
      { date: '2025-01-05T12:00:00Z' },
      // multiple sessions same day
      { date: '2025-01-05T13:00:00Z' },
    ]

    const { current, best } = computeStreaks(sessions, '2025-01-05')

    expect(current).toBe(1)
    expect(best).toBe(3)
  })

  test('counts today when session exists and computes best across history', () => {
    const sessions = [
      { date: '2025-06-01T10:00:00Z' },
      { date: '2025-06-02T10:00:00Z' },
      { date: '2025-06-03T10:00:00Z' },
    ]
    const { current, best } = computeStreaks(sessions, '2025-06-03')
    expect(current).toBe(3)
    expect(best).toBe(3)
  })
})
