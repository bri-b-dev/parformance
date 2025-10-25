import { describe, it, expect } from 'vitest'
import { computeLevelReached, computeLevelForDrill } from '../../src/hcp/level'
import type { Drill } from '../../src/types'

const targets = {
  '54-27': [2, 3, 4],
  '26–12': [5, 7, 9], // en dash in key should be supported
  '11-0': [11, 13, 15],
} as const

describe('computeLevelReached (table-driven)', () => {
  const table: Array<{ hcp: number, key: string, thresholds: [number, number, number], checks: Array<{ v: number, lvl: 0|1|2|3 }> }>
    = [
      { hcp: 36, key: '54-27', thresholds: [2,3,4], checks: [
        { v: 0, lvl: 0 }, { v: 1, lvl: 0 }, { v: 2, lvl: 1 }, { v: 3, lvl: 2 }, { v: 4, lvl: 3 }, { v: 5, lvl: 3 }
      ] },
      { hcp: 18, key: '26–12', thresholds: [5,7,9], checks: [
        { v: 4, lvl: 0 }, { v: 5, lvl: 1 }, { v: 7, lvl: 2 }, { v: 8, lvl: 2 }, { v: 9, lvl: 3 }, { v: 12, lvl: 3 }
      ] },
      { hcp: 5, key: '11-0', thresholds: [11,13,15], checks: [
        { v: 10, lvl: 0 }, { v: 11, lvl: 1 }, { v: 13, lvl: 2 }, { v: 14, lvl: 2 }, { v: 15, lvl: 3 }, { v: 21, lvl: 3 }
      ] },
    ]

  it('returns correct level for each table row', () => {
    for (const row of table) {
      const hcpTargets: Record<string, number[]> = { ...targets }
      // Ensure thresholds match the table definition in case targets are edited
      hcpTargets[row.key] = [...row.thresholds]
      for (const { v, lvl } of row.checks) {
        expect(computeLevelReached(row.hcp, hcpTargets, v)).toBe(lvl)
      }
    }
  })

  it('handles missing/invalid inputs by returning 0', () => {
    expect(computeLevelReached(null, targets as any, 5)).toBe(0) // no HCP → no bucket
    expect(computeLevelReached(18, {} as any, 5)).toBe(0)        // no targets
    expect(computeLevelReached(18, targets as any, NaN as any)).toBe(0) // invalid value
  })

  it('supports convenience wrapper with Drill', () => {
    const drill: Drill = {
      id: 'chip_carry_zone',
      title: 'Carry Zone',
      category: 'Chipping Green',
      equipment: {},
      setup: { schema: 'x' },
      duration: {},
      instructions: { training: 'x' },
      metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: { ...targets } },
    }
    expect(computeLevelForDrill(drill, 18, 9)).toBe(3) // hcp 18 → bucket 26–12 → 9 maps to level 3
    expect(computeLevelForDrill(drill, 36, 3)).toBe(2) // hcp 36 → 54-27 → 3 maps to level 2
  })

  it('gracefully handles short threshold arrays', () => {
    const short = { '54-27': [3] } // only L1 provided
    expect(computeLevelReached(36, short as any, 2)).toBe(0)
    expect(computeLevelReached(36, short as any, 3)).toBe(1)
    expect(computeLevelReached(36, short as any, 10)).toBe(1) // cannot reach >1 without L2/L3 thresholds
  })
})
