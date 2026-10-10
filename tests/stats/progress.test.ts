import { describe, expect, it } from 'vitest'
import { categoryRows, computeKpis, filterSessions, improvements, nextSteps, trendText } from '@/stats/progress'
import { buildSeries } from '@/stats/series'
import type { Drill, Session } from '@/types'

const now = new Date(2026, 9, 10, 12)
const dayAgo = (n: number, h = 10) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, h).toISOString()

const drills = [
  { id: 'p1', title: 'Putt 1', category: 'Putting', duration: { hardStop: 10 }, metric: { type: 'streak', unit: 'x', hcpTargets: { '54-0': [3, 5, 8] } } },
  { id: 'c1', title: 'Chip 1', category: 'Chipping', duration: { hardStop: 15 }, metric: { type: 'sum', unit: 'S', smallerIsBetter: true, hcpTargets: { '54-0': [30, 27, 24] } } },
] as unknown as Drill[]

const s = (id: string, drillId: string, value: number, date: string, extra: Partial<Session> = {}): Session =>
  ({ id, drillId, date, hcp: 20, result: { value, unit: 'x' }, ...extra })

describe('filterSessions', () => {
  const list = [s('a', 'p1', 1, dayAgo(2)), s('b', 'p1', 1, dayAgo(20)), s('c', 'c1', 1, dayAgo(100)), s('d', 'p1', 1, 'kaputt')]
  it('limits by period and category and drops invalid dates', () => {
    expect(filterSessions(list, drills, { days: 7, now }).map(x => x.id)).toEqual(['a'])
    expect(filterSessions(list, drills, { days: 30, now }).map(x => x.id)).toEqual(['a', 'b'])
    expect(filterSessions(list, drills, { days: 0, now }).map(x => x.id)).toEqual(['a', 'b', 'c'])
    expect(filterSessions(list, drills, { days: 0, category: 'Chipping', now }).map(x => x.id)).toEqual(['c'])
  })
})

describe('computeKpis', () => {
  it('counts sessions, per week, minutes (timer or plan), PBs against the full history and drills', () => {
    const all = [
      s('old', 'p1', 5, dayAgo(60)),
      s('a', 'p1', 7, dayAgo(10), { timerUsed: 300 }), // PB (beats 5), 5 min by timer
      s('b', 'c1', 28, dayAgo(5)), // first result of c1: no PB, planned 15 min
      s('c', 'p1', 6, dayAgo(2)), // not a PB, planned 10 min
    ]
    const period = filterSessions(all, drills, { days: 30, now })
    const k = computeKpis({ periodSessions: period, allSessions: all, drills, days: 30, now })
    expect(k).toMatchObject({ sessions: 3, minutes: 30, minutesEstimated: true, pbs: 1, drills: 2 })
    expect(k.perWeek).toBeCloseTo(3 / (30 / 7))
  })

  it('reports exact minutes when every session used the timer, and handles an empty period', () => {
    const only = [s('a', 'p1', 7, dayAgo(1), { timerUsed: 600 })]
    expect(computeKpis({ periodSessions: only, allSessions: only, drills, days: 7, now })).toMatchObject({ minutes: 10, minutesEstimated: false })
    expect(computeKpis({ periodSessions: [], allSessions: [], drills, days: 7, now })).toMatchObject({ sessions: 0, perWeek: null, minutes: 0, pbs: 0 })
  })

  it('uses the time since the first session (at least a week) for "all"', () => {
    const list = [s('a', 'p1', 1, dayAgo(28)), s('b', 'p1', 2, dayAgo(1))]
    expect(computeKpis({ periodSessions: list, allSessions: list, drills, days: 0, now }).perWeek).toBeCloseTo(2 / 4, 1)
    const fresh = [s('a', 'p1', 1, dayAgo(1))]
    expect(computeKpis({ periodSessions: fresh, allSessions: fresh, drills, days: 0, now }).perWeek).toBe(1)
  })
})

describe('categoryRows and trendText', () => {
  it('compares with the period before and marks missing data', () => {
    const list = [
      s('p-old', 'p1', 4, dayAgo(40), { levelReached: 1 }), // previous 30 days (31..60 ago): level 1 -> 33 %
      s('p-new', 'p1', 8, dayAgo(3), { levelReached: 3 }), // current period: level 3 -> 100 %
    ]
    const rows = categoryRows({ sessions: list, drills, days: 30, mode: 'historical', now })
    const put = rows.find(r => r.category === 'Putting')!
    expect(put).toMatchObject({ score: 100, previous: 33, delta: 67, hasData: true })
    expect(trendText(put)).toEqual({ symbol: '▲', text: '+67 Pkt ggü. dem Zeitraum davor' })
    const chip = rows.find(r => r.category === 'Chipping')!
    expect(chip.hasData).toBe(false)
    expect(trendText(chip).text).toBe('keine Sessions im Zeitraum')
  })

  it('has no comparison for "all" or without earlier sessions', () => {
    const list = [s('a', 'p1', 8, dayAgo(3), { levelReached: 3 })]
    expect(categoryRows({ sessions: list, drills, days: 0, mode: 'historical', now })[0].delta).toBeNull()
    expect(categoryRows({ sessions: list, drills, days: 30, mode: 'historical', now })[0].delta).toBeNull()
    expect(trendText({ delta: null, hasData: true }).text).toBe('kein Vergleich möglich')
  })

  it('formats falling and flat trends', () => {
    expect(trendText({ delta: -12, hasData: true })).toEqual({ symbol: '▼', text: '−12 Pkt ggü. dem Zeitraum davor' })
    expect(trendText({ delta: 0, hasData: true })).toEqual({ symbol: '►', text: 'unverändert ggü. dem Zeitraum davor' })
  })
})

describe('nextSteps and improvements', () => {
  const areas = {
    evaluatedForTarget: 2,
    belowTarget: [
      { id: 'p1', latestLevel: 0, gap: 2, latestValue: 5, targetValue: 12 },
      { id: 'c1', latestLevel: 1, gap: 1 },
    ],
    stagnant: [{ id: 'c1', latestLevel: 1 }, { id: 'zz', title: 'Zz', latestLevel: 2 }],
    mostImproved: [
      { id: 'p1', maPrev5: 3, maLast5: 3.43, delta: 0.43 },
      { id: 'c1', maPrev5: 3, maLast5: 2, delta: -1 },
    ],
  } as never

  it('writes one labeled sentence per step, target first, no duplicates', () => {
    const steps = nextSteps(areas, drills, { targetHcp: 12 })
    expect(steps.map(x => x.kind)).toEqual(['target', 'level', 'stagnant'])
    expect(steps[0].text).toBe('Putt 1: zuletzt 5, Ziel für HCP 12 ist 12.')
    expect(steps[1].text).toBe('Chip 1: Level 1 von 3, hier ist noch Luft nach oben.')
    expect(steps[2].text).toContain('Zz: seit zehn Sessions kaum Veränderung (Level 2 von 3)')
  })

  it('limits the list', () => {
    expect(nextSteps(areas, drills, { targetHcp: null, limit: 1 })).toHaveLength(1)
  })

  it('names the improvement with its unit of comparison, never a bare number', () => {
    const list = improvements(areas, drills)
    expect(list).toHaveLength(1)
    expect(list[0].text).toBe('Putt 1: Ø der letzten 5 Sessions +0,4 gegenüber den 5 davor.')
  })
})

describe('buildSeries', () => {
  const list = [s('a', 'p1', 4, dayAgo(40)), s('b', 'p1', 6, dayAgo(10)), s('c', 'p1', 9, dayAgo(1))]

  it('orders results by time and puts better results higher', () => {
    const m = buildSeries({ sessions: list, thresholds: [3, 5, 8], smallerIsBetter: false, days: 0, now })!
    expect(m.points.map(p => p.value)).toEqual([4, 6, 9])
    expect(m.points[0].x).toBe(0)
    expect(m.points[2].x).toBe(1)
    expect(m.points[0].y).toBeLessThan(m.points[2].y)
    expect(m.lines.map(l => l.value)).toEqual([3, 5, 8])
    expect(m.lines[0].y).toBeLessThan(m.lines[2].y)
    expect(m.best).toBe(9)
    expect(m.summary).toBe('3 Ergebnisse, erstes 4, letztes 9, Bestwert 9.')
  })

  it('mirrors the axis for smaller-is-better', () => {
    const m = buildSeries({ sessions: [s('a', 'c1', 30, dayAgo(10)), s('b', 'c1', 26, dayAgo(1))], thresholds: [30, 27, 24], smallerIsBetter: true, days: 0, now })!
    expect(m.points[1].y).toBeGreaterThan(m.points[0].y) // 26 is better than 30 -> higher
    expect(m.lines[2].y).toBeGreaterThan(m.lines[0].y)
    expect(m.best).toBe(26)
  })

  it('zooms to the last days, keeps y inside 0..1 and handles single and no results', () => {
    expect(buildSeries({ sessions: list, thresholds: [], smallerIsBetter: false, days: 30, now })!.points.map(p => p.value)).toEqual([6, 9])
    const one = buildSeries({ sessions: [list[0]], thresholds: [3, 5, 8], smallerIsBetter: false, days: 0, now })!
    expect(one.points[0].x).toBe(0.5)
    expect(one.summary).toBe('1 Ergebnis, erstes 4, letztes 4, Bestwert 4.')
    for (const y of [...one.points.map(p => p.y), ...one.lines.map(l => l.y)]) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
    }
    expect(buildSeries({ sessions: [], thresholds: [], smallerIsBetter: false, days: 0, now })).toBeNull()
    expect(buildSeries({ sessions: list, thresholds: [], smallerIsBetter: false, days: 7, now: new Date(2030, 0, 1) })).toBeNull()
  })
})
