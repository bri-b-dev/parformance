import { describe, expect, it } from 'vitest'
import { computeGoalProgress, formatGoalDate } from '@/stats/goal'

describe('computeGoalProgress', () => {
  const now = new Date(2026, 9, 10, 15, 30) // 2026-10-10 local
  it('counts calendar days and rounds weeks up', () => {
    expect(computeGoalProgress('2026-10-10', now)).toEqual({ daysLeft: 0, weeksLeft: 0, overdue: false })
    expect(computeGoalProgress('2026-10-11', now)).toMatchObject({ daysLeft: 1, weeksLeft: 1 })
    expect(computeGoalProgress('2026-12-31', now)).toMatchObject({ daysLeft: 82, weeksLeft: 12 })
  })
  it('flags overdue dates', () => {
    expect(computeGoalProgress('2026-10-01', now)).toMatchObject({ daysLeft: -9, weeksLeft: 0, overdue: true })
  })
  it('returns null for missing or malformed dates', () => {
    expect(computeGoalProgress(null, now)).toBeNull()
    expect(computeGoalProgress('31.12.2026', now)).toBeNull()
  })
  it('formats german dates', () => {
    expect(formatGoalDate('2026-12-31')).toBe('31.12.2026')
  })
})
