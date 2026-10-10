import { describe, expect, it } from 'vitest'
import { latestLevelByDrill } from '@/stats/categoryScores'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import type { Drill, Session } from '@/types'

const drill = {
  id: 'd1', title: 'D', category: 'Putting',
  metric: { type: 'streak', unit: 'x', hcpTargets: { '54-30': [3, 4, 5], '29-0': [8, 10, 12] } },
} as unknown as Drill

const session: Session = {
  id: 's1', drillId: 'd1', date: '2026-01-10T10:00:00.000Z', hcp: 40,
  result: { value: 5, unit: 'x' }, levelReached: 3,
}

describe('evaluation mode', () => {
  it('historical keeps the stored snapshot, current re-evaluates with the latest hcp', () => {
    const h = useHcpHistoryStore()
    h.rows = [
      { id: 'a', hcp: 40, valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-06-01T00:00:00.000Z' },
      { id: 'b', hcp: 15, valid_from: '2026-06-01T00:00:00.000Z', valid_to: null },
    ]
    expect(latestLevelByDrill([session], [drill], 'historical')).toEqual({ d1: 3 })
    expect(latestLevelByDrill([session], [drill], 'current')).toEqual({ d1: 0 }) // 5 < 8 at hcp 15
  })
})
