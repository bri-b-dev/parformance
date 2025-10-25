import { describe, it, expect } from 'vitest'
import { computeFrequentlyBelowTarget } from '../../src/stats/belowTarget'
import type { Drill, Session } from '../../src/types'

const drills: Drill[] = [
  { id: 'dA', title: 'Carry Zone', category: 'Chipping Green', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'streak', unit: 'u', hcpTargets: { '54-27': [2,3,4], '26-12': [5,7,9], '11-0': [11,13,15] } } },
  { id: 'dB', title: '14 Fairways', category: 'Driving Range', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'corridor_hits', unit: 'u', hcpTargets: { '54-27': [4,7,11], '26-12': [7,9,11], '11-0': [11,13,14] } } },
  { id: 'dC', title: 'Points Ladder', category: 'Putting Green', equipment: {}, setup: { schema: 'x' }, duration: {}, instructions: { training: 'x' }, metric: { type: 'points_total', unit: 'u', hcpTargets: { '54-27': [10,15,20], '26-12': [15,20,25], '11-0': [20,25,30] } } },
]

function s(id: string, drillId: string, date: string, value: number, extras: Partial<Session> = {}): Session {
  return { id, drillId, date, hcp: 18, result: { value, unit: 'u' }, ...extras }
}

describe('computeFrequentlyBelowTarget', () => {
  it('uses last N sessions (default 5) and sorts by % below target desc', () => {
    const sessions: Session[] = [
      // dA: 6 sessions (value threshold for hcp 18 bucket 26-12 is [5,7,9]) → level 0 when value < 5
      s('a1','dA','2025-01-01T10:00:00Z', 3), // below
      s('a2','dA','2025-02-01T10:00:00Z', 4), // below
      s('a3','dA','2025-03-01T10:00:00Z', 5), // ok
      s('a4','dA','2025-04-01T10:00:00Z', 6), // ok
      s('a5','dA','2025-05-01T10:00:00Z', 1), // below
      s('a6','dA','2025-06-01T10:00:00Z', 2), // below

      // dB: 3 sessions → fewer than N; bucket 26-12 thresholds [7,9,11]; below when < 7
      s('b1','dB','2025-05-01T10:00:00Z', 6), // below
      s('b2','dB','2025-06-01T10:00:00Z', 8), // ok
      s('b3','dB','2025-07-01T10:00:00Z', 4), // below

      // dC: 5 sessions; bucket 26-12 thresholds [15,20,25]; below when < 15
      s('c1','dC','2025-03-01T10:00:00Z', 12), // below
      s('c2','dC','2025-04-01T10:00:00Z', 14), // below
      s('c3','dC','2025-05-01T10:00:00Z', 15), // ok
      s('c4','dC','2025-06-01T10:00:00Z', 17), // ok
      s('c5','dC','2025-07-01T10:00:00Z', 13), // below

      // unknown drill id should be ignored
      s('x1','dX','2025-01-01T00:00:00Z', 0),
    ]

    const rows = computeFrequentlyBelowTarget(sessions, drills, 18)

    // Compute expected below counts over last 5
    // dA last 5 are a2..a6 (drop a1). Among those: a2 below, a3 ok, a4 ok, a5 below, a6 below → 3/5 → 60%
    // dB considered 3: b1 below, b2 ok, b3 below → 2/3 ≈ 66.67%
    // dC considered 5: c1 below, c2 below, c3 ok, c4 ok, c5 below → 3/5 = 60%

    // Sorting by pct desc → dB (~66.67%), then dA (60%, 5 considered) vs dC (60%, 5 considered) → tie-break by title asc
    expect(rows.map(r => r.drillId)).toEqual(['dB', 'dA', 'dC'])

    const dB = rows.find(r => r.drillId === 'dB')!
    expect(dB.considered).toBe(3)
    expect(dB.below).toBe(2)
    expect(dB.pctBelow).toBeCloseTo((2/3)*100, 5)

    const dA = rows.find(r => r.drillId === 'dA')!
    expect(dA.considered).toBe(5)
    expect(dA.below).toBe(3)
    expect(dA.pctBelow).toBeCloseTo(60)

    const dC = rows.find(r => r.drillId === 'dC')!
    expect(dC.considered).toBe(5)
    expect(dC.below).toBe(3)
    expect(dC.pctBelow).toBeCloseTo(60)
  })

  it('respects custom N and uses session.levelReached when present', () => {
    const sessions: Session[] = [
      // dA: mark some with precomputed levelReached to bypass compute
      s('a1','dA','2025-01-01T10:00:00Z', 999, { levelReached: 0 }), // below regardless of value
      s('a2','dA','2025-02-01T10:00:00Z', 999, { levelReached: 1 }), // ok
      s('a3','dA','2025-03-01T10:00:00Z', 999, { levelReached: 0 }), // below
      s('a4','dA','2025-04-01T10:00:00Z', 999, { levelReached: 2 }), // ok
    ]
    // N=3 → consider a2..a4 → levels [1,0,2] → 1 below out of 3
    const rows = computeFrequentlyBelowTarget(sessions, drills, 18, 3)
    expect(rows.length).toBe(1)
    expect(rows[0].drillId).toBe('dA')
    expect(rows[0].considered).toBe(3)
    expect(rows[0].below).toBe(1)
    expect(rows[0].pctBelow).toBeCloseTo((1/3)*100, 5)
  })
})
