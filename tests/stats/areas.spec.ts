import { describe, it, expect } from 'vitest'
import { computeAreasOfImprovement } from '../../src/stats/areas'

describe('Areas of improvement', () => {
  it('identifies drills below HCP target', () => {
    const drills: any[] = [
      { id: 'd1', title: 'One', category: 'A', metric: { hcpTargets: { '11-0': [10], '26-12': [7] } } },
      { id: 'd2', title: 'Two', category: 'B', metric: { hcpTargets: { '11-0': [5], '26-12': [3] } } },
    ]
    const sessions: any[] = [
      { id: 's1', drillId: 'd1', date: '2025-01-01T00:00:00Z', levelReached: 6, result: { value: 6 } },
      { id: 's2', drillId: 'd2', date: '2025-01-02T00:00:00Z', levelReached: 6, result: { value: 6 } },
    ]
    // user HCP falls into 11-0 => target for d1 is 10, latest 6 -> below; d2 target 5 latest6 -> not below
    const res = computeAreasOfImprovement(sessions as any, drills as any, 5)
    expect(res.belowTarget.some(d => d.id === 'd1')).toBe(true)
    expect(res.belowTarget.some(d => d.id === 'd2')).toBe(false)
  })

  it('marks stagnant when moving averages are similar within tolerance', () => {
    const drills: any[] = [ { id: 'd1', title: 'One', category: 'A', metric: { hcpTargets: {} } } ]
    // create 10 values where last5 avg equals prev5 avg
    const vals = [1,1,1,1,1,1,1,1,1,1]
    const sessions = vals.map((v,i) => ({ id: `s${i}`, drillId: 'd1', date: `2025-01-${i+1}T00:00:00Z`, result: { value: v } }))
    const res = computeAreasOfImprovement(sessions as any, drills as any, 10, { stagnantTolerance: 0.01 })
    expect(res.stagnant.some(d => d.id === 'd1')).toBe(true)
  })

  it('reports most improved sorted by delta', () => {
    const drills: any[] = [
      { id: 'd1', title: 'One', category: 'A', metric: { hcpTargets: {} } },
      { id: 'd2', title: 'Two', category: 'B', metric: { hcpTargets: {} } },
    ]
    // d1 improved by 4 (prev5 avg 1 -> last5 avg 5), d2 improved by 2
    const s1 = Array.from({ length: 10 }).map((_,i) => ({ id: `a${i}`, drillId: 'd1', result: { value: i < 5 ? 1 : 5 }, date: `2025-01-${i+1}T00:00:00Z` }))
    const s2 = Array.from({ length: 10 }).map((_,i) => ({ id: `b${i}`, drillId: 'd2', result: { value: i < 5 ? 2 : 4 }, date: `2025-01-${i+1}T00:00:00Z` }))
    const res = computeAreasOfImprovement([...s1, ...s2] as any, drills as any, 12)
    expect(res.mostImproved.length).toBeGreaterThanOrEqual(2)
    // first should be d1
    expect(res.mostImproved[0].id).toBe('d1')
    expect(res.mostImproved[1].id).toBe('d2')
  })
})
