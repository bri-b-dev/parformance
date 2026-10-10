import { describe, expect, it } from 'vitest'
import { fmtNumber, summarizeResult } from '@/session/summary'
import type { Drill } from '@/types'

const big = { id: 'b', metric: { type: 'streak', unit: 'x', hcpTargets: { '54-0': [4, 6, 9] } } } as unknown as Drill
const small = { id: 's', metric: { type: 'sum', unit: 'Schläge', smallerIsBetter: true, hcpTargets: { '54-0': [30, 27, 24] } } } as unknown as Drill

describe('fmtNumber', () => {
  it('uses a decimal comma and at most one decimal', () => {
    expect(fmtNumber(2)).toBe('2')
    expect(fmtNumber(2.25)).toBe('2,3')
    expect(fmtNumber(0.04)).toBe('0')
  })
})

describe('summarizeResult', () => {
  it('computes the level and the distance to the next level (greater is better)', () => {
    const s = summarizeResult({ drill: big, value: 5, previousValues: [], hcp: 20 })
    expect(s.level).toBe(1)
    expect(s.nextText).toBe('noch +1 bis ★★')
    expect(summarizeResult({ drill: big, value: 6, previousValues: [], hcp: 20 }).nextText).toBe('noch +3 bis ★★★')
    expect(summarizeResult({ drill: big, value: 9, previousValues: [], hcp: 20 })).toMatchObject({ level: 3, nextText: 'Höchste Stufe erreicht' })
  })

  it('counts downwards for smaller-is-better drills', () => {
    const s = summarizeResult({ drill: small, value: 28, previousValues: [], hcp: 20 })
    expect(s.level).toBe(1)
    expect(s.nextText).toBe('noch −1 bis ★★')
    expect(summarizeResult({ drill: small, value: 35, previousValues: [], hcp: 20 })).toMatchObject({ level: 0, nextText: 'noch −5 bis ★' })
  })

  it('asks for a handicap when none is known and has no level', () => {
    const s = summarizeResult({ drill: big, value: 5, previousValues: [], hcp: null })
    expect(s.level).toBeNull()
    expect(s.nextText).toContain('Handicap')
  })

  it('has no level text for drills without thresholds', () => {
    const none = { id: 'n', metric: { type: 'streak', unit: 'x', hcpTargets: {} } } as unknown as Drill
    expect(summarizeResult({ drill: none, value: 5, previousValues: [], hcp: 20 })).toMatchObject({ level: null, nextText: null })
  })

  it('compares with the best and the average of the last five earlier results', () => {
    const s = summarizeResult({ drill: big, value: 8, previousValues: [1, 2, 3, 4, 5, 9, 7], hcp: 20 })
    expect(s.best).toBe(9)
    expect(s.bestDelta).toBe(-1)
    expect(s.isPb).toBe(false)
    expect(s.average).toBeCloseTo((4 + 5 + 9 + 7 + 3) / 5)
    expect(s.averageDelta).toBeCloseTo(8 - (3 + 4 + 5 + 9 + 7) / 5)
  })

  it('flags a personal best only when strictly better than every earlier result', () => {
    expect(summarizeResult({ drill: big, value: 10, previousValues: [9, 5], hcp: 20 }).isPb).toBe(true)
    expect(summarizeResult({ drill: big, value: 9, previousValues: [9, 5], hcp: 20 }).isPb).toBe(false)
    expect(summarizeResult({ drill: big, value: 99, previousValues: [], hcp: 20 })).toMatchObject({ isPb: false, best: null, average: null })
    expect(summarizeResult({ drill: small, value: 25, previousValues: [30, 27], hcp: 20 }).isPb).toBe(true)
    expect(summarizeResult({ drill: small, value: 28, previousValues: [30, 27], hcp: 20 }).isPb).toBe(false)
  })

  it('treats score_vs_par as smaller-is-better', () => {
    const par = { id: 'p', metric: { type: 'score_vs_par', unit: 'x', hcpTargets: {} } } as unknown as Drill
    expect(summarizeResult({ drill: par, value: -2, previousValues: [0, 1], hcp: null }).isPb).toBe(true)
  })
})
