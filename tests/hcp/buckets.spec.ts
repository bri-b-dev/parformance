import { describe, it, expect } from 'vitest'
import { findBucketKey, formatRangeLabel, buildHcpRows, buildRowsForDrill } from '../../src/hcp/buckets'
import type { Drill } from '../../src/types'

const hcpTargets = {
  '54-27': [2, 3, 4],
  '26-12': [5, 7, 9],
  '11-0': [11, 13, 15],
} as const

describe('hcp buckets utility', () => {
  it('findBucketKey maps HCP 18 to "26-12"', () => {
    expect(findBucketKey(18, hcpTargets as any)).toBe('26-12')
  })

  it('formatRangeLabel uses en dash', () => {
    expect(formatRangeLabel('26-12')).toBe('26–12')
  })

  it('buildHcpRows highlights the correct row for HCP 18 and keeps 3 levels', () => {
    const rows = buildHcpRows(hcpTargets as any, 18)
    const target = rows.find(r => r.key === '26-12')!
    expect(target.highlighted).toBe(true)
    expect(target.values).toEqual([5, 7, 9])
    // Ensure all rows have 3 columns worth of values (may be undefined but array length respected)
    for (const r of rows) {
      expect(Array.isArray(r.values)).toBe(true)
      expect(r.values.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('buildRowsForDrill integrates with Drill object', () => {
    const drill: Drill = {
      id: 'chip_carry_zone',
      title: 'Carry Zone',
      category: 'Chipping Green',
      equipment: {},
      setup: { schema: 'x' },
      duration: {},
      instructions: { training: 'do it' },
      metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: { ...hcpTargets } },
    }
    const rows = buildRowsForDrill(drill, 18)
    const target = rows.find(r => r.key === '26-12')!
    expect(target.label).toBe('26–12')
    expect(target.highlighted).toBe(true)
  })
})
