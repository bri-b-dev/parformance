import { describe, expect, it } from 'vitest'
import { computeActiveStreak, sessionsThisWeek } from '@/utils/streaks'

const at = (y: number, m: number, d: number, h = 10) => ({ date: new Date(y, m - 1, d, h).toISOString() })

describe('computeActiveStreak', () => {
  const now = new Date(2026, 9, 10, 12) // Sat 2026-10-10
  it('counts up to today when practiced today', () => {
    expect(computeActiveStreak([at(2026, 10, 10), at(2026, 10, 9), at(2026, 10, 8)], now)).toEqual({ current: 3, practicedToday: true })
  })
  it('keeps the streak alive until the day ends', () => {
    expect(computeActiveStreak([at(2026, 10, 9), at(2026, 10, 8)], now)).toEqual({ current: 2, practicedToday: false })
  })
  it('breaks after a missed day', () => {
    expect(computeActiveStreak([at(2026, 10, 8), at(2026, 10, 7)], now)).toEqual({ current: 0, practicedToday: false })
    expect(computeActiveStreak([], now)).toEqual({ current: 0, practicedToday: false })
  })
})

describe('sessionsThisWeek', () => {
  it('counts from Monday 00:00 local', () => {
    const now = new Date(2026, 9, 10, 12) // Saturday
    const list = [at(2026, 10, 5, 0), at(2026, 10, 9), at(2026, 10, 4, 23), at(2026, 9, 28)]
    expect(sessionsThisWeek(list, now)).toBe(2)
  })
  it('treats Sunday as the last day of the week', () => {
    const now = new Date(2026, 9, 11, 9) // Sunday
    expect(sessionsThisWeek([at(2026, 10, 5), at(2026, 10, 4)], now)).toBe(1)
  })
})
