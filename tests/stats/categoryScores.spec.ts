import { describe, it, expect } from 'vitest'
import { buildDrillCategoryMap, latestLevelByDrill, levelToPct, computeCategoryScores } from '../../src/stats/categoryScores'
import type { Drill, Session } from '../../src/types'

const drills: Drill[] = [
  { id: 'd_putt_a', title: 'Putt A', category: 'Putting Green', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'streak', unit: 'u', hcpTargets: {} } },
  { id: 'd_chip_a', title: 'Chip A', category: 'Chipping Green', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'streak', unit: 'u', hcpTargets: {} } },
  { id: 'd_chip_b', title: 'Chip B', category: 'Chipping Green', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'streak', unit: 'u', hcpTargets: {} } },
  { id: 'd_range', title: 'Range A', category: 'Driving Range', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'streak', unit: 'u', hcpTargets: {} } },
]

const sessions: Session[] = [
  // Two sessions for same drill; latest by date should win
  { id: 's1', drillId: 'd_putt_a', date: '2025-01-01T10:00:00Z', hcp: 18, result: { value: 5, unit: 'u' }, levelReached: 1 },
  { id: 's2', drillId: 'd_putt_a', date: '2025-02-01T10:00:00Z', hcp: 18, result: { value: 6, unit: 'u' }, levelReached: 3 },

  // Two different drills in the same category (Chipping Green)
  { id: 's3', drillId: 'd_chip_a', date: '2025-02-01T09:00:00Z', hcp: 18, result: { value: 7, unit: 'u' }, levelReached: 2 },
  // Missing levelReached → treated as 0
  { id: 's4', drillId: 'd_chip_b', date: '2025-02-02T09:00:00Z', hcp: 18, result: { value: 8, unit: 'u' } },

  // Category with a single drill
  { id: 's5', drillId: 'd_range', date: '2025-03-01T10:00:00Z', hcp: 18, result: { value: 9, unit: 'u' }, levelReached: 1 },
]

describe('categoryScores stats', () => {
  it('buildDrillCategoryMap maps ids to categories', () => {
    const map = buildDrillCategoryMap(drills)
    expect(map['d_putt_a']).toBe('Putting Green')
    expect(map['d_chip_b']).toBe('Chipping Green')
  })

  it('latestLevelByDrill picks the latest session per drill and treats missing level as 0', () => {
    const latest = latestLevelByDrill(sessions)
    expect(latest['d_putt_a']).toBe(3) // s2 overrides s1
    expect(latest['d_chip_a']).toBe(2)
    expect(latest['d_chip_b']).toBe(0) // missing level
  })

  it('levelToPct normalizes 0–3 to 0–100', () => {
    expect(levelToPct(0)).toBe(0)
    expect(levelToPct(1)).toBeCloseTo(100/3)
    expect(levelToPct(2)).toBeCloseTo(200/3)
    expect(levelToPct(3)).toBe(100)
    // out-of-range clamped
    expect(levelToPct(99)).toBe(100)
    expect(levelToPct(-5)).toBe(0)
  })

  it('computeCategoryScores returns average percentage per category (0–100) and 0 for categories without sessions', () => {
    const scores = computeCategoryScores(sessions, drills)
    // Putting Green: latest level=3 → 100%
    expect(scores['Putting Green']).toBe(100)

    // Chipping Green: levels [2, 0] → avg = (66.666.. + 0) / 2 ≈ 33.333..
    expect(scores['Chipping Green']).toBeCloseTo((2/3*100)/2, 5) // 33.3333

    // Driving Range: level 1 → 33.333..
    expect(scores['Driving Range']).toBeCloseTo(100/3)
  })

  it('handles empty inputs', () => {
    expect(computeCategoryScores([], [])).toEqual({})
    // categories present but no sessions → zeros
    const onlyDrills = drills.slice(0, 2)
    const s = computeCategoryScores([], onlyDrills)
    expect(s['Putting Green']).toBe(0)
    expect(s['Chipping Green']).toBe(0)
  })
})
