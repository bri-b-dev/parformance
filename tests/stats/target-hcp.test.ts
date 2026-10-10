import { describe, expect, it } from 'vitest'
import { computeAreasOfImprovement } from '@/stats/areas'
import { valueForLevel } from '@/hcp/level'
import { buildHcpRows } from '@/hcp/buckets'
import { useSettingsStore, normalizeHcp, normalizeDate } from '@/stores/settings'
import type { Drill, Session } from '@/types'

const drill = {
  id: 'putt', title: 'Putt', category: 'Putting',
  metric: { type: 'streak', unit: 'x', hcpTargets: { '54-27': [3, 4, 5], '26-12': [6, 8, 10], '11-0': [10, 12, 15] } },
} as unknown as Drill
const small = {
  id: 'strokes', title: 'Strokes', category: 'Short game',
  metric: { type: 'sum', unit: 'Schläge', smallerIsBetter: true, hcpTargets: { '54-27': [30, 27, 24], '11-0': [22, 20, 18] } },
} as unknown as Drill

const sess = (drillId: string, value: number, date = '2026-02-01T10:00:00.000Z'): Session => ({
  id: drillId + date, drillId, date, hcp: 30, result: { value, unit: 'x' },
})

describe('valueForLevel', () => {
  it('returns the result needed per level for both directions', () => {
    expect(valueForLevel([3, 4, 5], 2)).toBe(4)
    expect(valueForLevel([24, 27, 30], 2, true)).toBe(27)
    expect(valueForLevel([5], 2)).toBeNull()
  })
})

describe('areas with target HCP', () => {
  it('flags drills whose latest result misses level 2 of the target bucket', () => {
    const r = computeAreasOfImprovement([sess('putt', 5), sess('strokes', 19)], [drill, small], 30, { targetHcp: 8 })
    expect(r.belowTarget.map(d => d.id)).toEqual(['putt'])
    expect(r.belowTarget[0]).toMatchObject({ latestValue: 5, targetValue: 12 })
  })
  it('does not flag results that reach the target level', () => {
    const r = computeAreasOfImprovement([sess('putt', 12), sess('strokes', 20)], [drill, small], 30, { targetHcp: 8 })
    expect(r.belowTarget).toEqual([])
  })
  it('smaller-is-better drills compare downwards', () => {
    const r = computeAreasOfImprovement([sess('strokes', 23)], [small], 30, { targetHcp: 8 })
    expect(r.belowTarget[0]).toMatchObject({ id: 'strokes', targetValue: 20 })
  })
})

describe('buildHcpRows', () => {
  it('marks own and target bucket', () => {
    const rows = buildHcpRows(drill.metric.hcpTargets, 30, 8)
    expect(rows.find(r => r.highlighted)?.key).toBe('54-27')
    expect(rows.find(r => r.isTarget)?.key).toBe('11-0')
  })
})

describe('settings target', () => {
  it('normalizes values', () => {
    expect(normalizeHcp(12.4)).toBe(12.4)
    expect(normalizeHcp(99)).toBeNull()
    expect(normalizeHcp('3')).toBeNull()
    expect(normalizeDate('2026-12-31')).toBe('2026-12-31')
    expect(normalizeDate('31.12.2026')).toBeNull()
  })
  it('persists target hcp and date', async () => {
    const s = useSettingsStore()
    await s.update({ targetHcp: 12, targetDate: '2026-12-31' })
    expect(s.targetHcp).toBe(12)
    s.targetHcp = null
    s.targetDate = null
    await new Promise(r => setTimeout(r, 400))
    await s.load()
    expect(s.targetHcp).toBe(12)
    expect(s.targetDate).toBe('2026-12-31')
  })
})
