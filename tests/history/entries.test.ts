import { describe, expect, it } from 'vitest'
import { buildHistory, formatDayLabel, limitHistory, personalBestIds } from '@/history/entries'
import type { Drill, Session } from '@/types'

const drills = [
  { id: 'big', title: 'Big', category: 'Putting', metric: { type: 'streak', unit: 'x', hcpTargets: {} } },
  { id: 'small', title: 'Small', category: 'Chipping', metric: { type: 'sum', unit: 'Schläge', smallerIsBetter: true, hcpTargets: {} } },
] as unknown as Drill[]

const s = (id: string, drillId: string, value: number, date: string): Session =>
  ({ id, drillId, date, hcp: 20, result: { value, unit: 'x' } })

const now = new Date(2026, 9, 10, 12)
const at = (day: number, h = 10) => new Date(2026, 9, day, h).toISOString()

describe('personalBestIds', () => {
  it('marks improvements only, never the first session, direction aware', () => {
    const list = [
      s('b1', 'big', 5, at(1)), s('b2', 'big', 7, at(2)), s('b3', 'big', 6, at(3)), s('b4', 'big', 7, at(4)), s('b5', 'big', 9, at(5)),
      s('s1', 'small', 30, at(1)), s('s2', 'small', 28, at(2)), s('s3', 'small', 29, at(3)),
    ]
    expect([...personalBestIds(list, drills)].sort()).toEqual(['b2', 'b5', 's2'])
  })
})

describe('buildHistory', () => {
  const list = [
    s('a', 'big', 5, at(10, 9)), s('b', 'small', 30, at(10, 15)), s('c', 'big', 7, at(9)), s('d', 'big', 3, at(1)), s('e', 'ghost', 1, at(2)),
  ]

  it('groups newest first by local day and counts totals', () => {
    const r = buildHistory(list, drills, { now })
    expect(r.days.map(d => d.entries.map(e => e.session.id))).toEqual([['b', 'a'], ['c'], ['e'], ['d']])
    expect(r.total).toBe(5)
    expect(r.drillCount).toBe(3)
  })

  it('keeps sessions of unknown drills and leaves the drill undefined', () => {
    const e = buildHistory(list, drills, { now }).days.flatMap(d => d.entries).find(x => x.session.id === 'e')!
    expect(e.drill).toBeUndefined()
    expect(e.level).toBeNull()
  })

  it('filters by category and period (period uses the full history for PBs)', () => {
    expect(buildHistory(list, drills, { now, category: 'Chipping' }).total).toBe(1)
    const week = buildHistory(list, drills, { now, days: 7 })
    expect(week.total).toBe(3)
    // 'c' (7) beat the older 'd' (3) even though 'd' is outside the period
    expect(week.days.flatMap(d => d.entries).find(e => e.session.id === 'c')!.isPb).toBe(true)
  })

  it('computes the level through the callback', () => {
    const r = buildHistory(list, drills, { now, levelOf: (_s, d) => (d.id === 'big' ? 2 : 1) })
    expect(r.days.flatMap(d => d.entries).find(e => e.session.id === 'b')!.level).toBe(1)
  })
})

describe('limitHistory and labels', () => {
  it('cuts at entry level across days', () => {
    const list = [s('a', 'big', 1, at(10, 9)), s('b', 'big', 2, at(10, 10)), s('c', 'big', 3, at(9))]
    const r = buildHistory(list, drills, { now })
    expect(limitHistory(r, 1).map(d => d.entries.length)).toEqual([1])
    expect(limitHistory(r, 2).map(d => d.entries.length)).toEqual([2])
    expect(limitHistory(r, 3).map(d => d.entries.length)).toEqual([2, 1])
    expect(limitHistory(r, 0)).toEqual([])
  })
  it('labels today, yesterday and older days in German', () => {
    expect(formatDayLabel('2026-10-10', now)).toBe('Heute')
    expect(formatDayLabel('2026-10-09', now)).toBe('Gestern')
    expect(formatDayLabel('2026-10-05', now)).toMatch(/Mo.*5.*Okt.*2026/)
  })
})
