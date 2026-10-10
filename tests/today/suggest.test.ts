import { describe, expect, it } from 'vitest'
import { drillMinutes, planSession, scoreDrills, suggestDrills, type SuggestContext } from '@/today/suggest'
import type { Drill, Session } from '@/types'

const mk = (id: string, category: string, min: number): Drill => ({
  id, title: id, category,
  duration: { hardStop: min },
  metric: { type: 'streak', unit: 'x', hcpTargets: {} },
}) as unknown as Drill

const sess = (drillId: string, daysAgo: number, now: Date): Session => ({
  id: `${drillId}${daysAgo}`, drillId, hcp: 20,
  date: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
  result: { value: 1, unit: 'x' },
})

const now = new Date(2026, 9, 10, 12, 0)

function ctx(over: Partial<SuggestContext> = {}): SuggestContext {
  return {
    drills: [mk('a', 'Putting', 10), mk('b', 'Chipping', 10), mk('c', 'Driving', 20)],
    sessions: [], now, belowTarget: [], categoryScores: {}, targetHcp: null, ...over,
  }
}

describe('drillMinutes', () => {
  it('prefers suggested minutes, then hard stop, then timer preset, else 10', () => {
    expect(drillMinutes({ duration: { suggestedMin: 7, hardStop: 20 } } as Drill)).toBe(7)
    expect(drillMinutes({ duration: { hardStop: 20 } } as Drill)).toBe(20)
    expect(drillMinutes({ duration: { timerPreset: 600 } } as Drill)).toBe(10)
    expect(drillMinutes({ duration: {} } as Drill)).toBe(10)
  })
})

describe('scoreDrills', () => {
  it('ranks a drill below the target HCP first and explains why', () => {
    const c = ctx({
      belowTarget: [{ id: 'b', latestLevel: 0, gap: 2, latestValue: 5, targetValue: 12 } as never],
      targetHcp: 12,
      sessions: [sess('a', 1, now), sess('b', 1, now), sess('c', 1, now)],
      categoryScores: { Putting: 50, Chipping: 50, Driving: 50 },
    })
    const top = scoreDrills(c)[0]
    expect(top.drill.id).toBe('b')
    expect(top.reason).toBe('Unter deinem Ziel-HCP 12: zuletzt 5, Ziel 12.')
  })

  it('prefers a drill not played for a long time and says so', () => {
    const c = ctx({
      sessions: [sess('a', 20, now), sess('b', 1, now), sess('c', 1, now)],
      categoryScores: { Putting: 80, Chipping: 80, Driving: 80 },
    })
    const top = scoreDrills(c)[0]
    expect(top.drill.id).toBe('a')
    expect(top.reason).toBe('Zuletzt vor 20 Tagen.')
  })

  it('mentions the weakest category', () => {
    const c = ctx({
      sessions: [sess('a', 3, now), sess('b', 3, now), sess('c', 3, now)],
      categoryScores: { Putting: 90, Chipping: 20, Driving: 90 },
    })
    const top = scoreDrills(c)[0]
    expect(top.drill.id).toBe('b')
    expect(top.reason).toBe('Chipping ist deine schwächste Kategorie (20 %).')
  })

  it('marks never-played drills and ranks drills played today last', () => {
    const c = ctx({ sessions: [sess('a', 0, now)], categoryScores: { Putting: 50 } })
    const all = scoreDrills(c)
    expect(all.at(-1)?.drill.id).toBe('a')
    expect(all.find(s => s.drill.id === 'b')?.reason).toBe('Noch nie gespielt - gut zum Kennenlernen.')
  })

  it('is stable within a day', () => {
    const ids = (c: SuggestContext) => scoreDrills(c).map(s => s.drill.id).join()
    expect(ids(ctx())).toBe(ids(ctx()))
  })
})

describe('suggestDrills', () => {
  it('limits drills per category', () => {
    const c = ctx({ drills: [mk('p1', 'Putting', 5), mk('p2', 'Putting', 5), mk('p3', 'Putting', 5), mk('c1', 'Chipping', 5)] })
    const out = suggestDrills(c, 3)
    expect(out.map(s => s.drill.category).sort()).toEqual(['Chipping', 'Putting'])
  })
})

describe('planSession', () => {
  const drills = [mk('a', 'Putting', 10), mk('b', 'Chipping', 10), mk('c', 'Driving', 20), mk('d', 'Putting', 15), mk('e', 'Putting', 5)]
  it.each([15, 30, 60])('never exceeds the %i minute budget', (budget) => {
    const plan = planSession(ctx({ drills }), budget)
    expect(plan.totalMinutes).toBeLessThanOrEqual(budget)
    expect(plan.totalMinutes).toBe(plan.items.reduce((n, s) => n + s.minutes, 0))
    expect(plan.items.length).toBeGreaterThan(0)
  })
  it('skips drills that are longer than the budget and caps categories at two', () => {
    const plan = planSession(ctx({ drills: [mk('long', 'Course', 120), mk('p1', 'Putting', 5), mk('p2', 'Putting', 5), mk('p3', 'Putting', 5)] }), 60)
    expect(plan.items.some(s => s.drill.id === 'long')).toBe(false)
    expect(plan.items.filter(s => s.drill.category === 'Putting')).toHaveLength(2)
  })
  it('returns an empty plan when nothing fits', () => {
    expect(planSession(ctx({ drills: [mk('long', 'Course', 120)] }), 15).items).toEqual([])
  })
})
