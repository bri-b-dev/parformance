import { describe, it, expect } from 'vitest'
import { validateMetricValue } from '../../src/metrics/validation'
import type { MetricType } from '../../src/types'

const unitFor: Record<MetricType, string> = {
  streak: 'Putts in Folge',
  count_in_time: 'Treffer in 60s',
  points_total: 'Punkte',
  stations_cleared: 'Stationen',
  corridor_hits: 'Treffer',
  score_vs_par: 'Score vs Par',
}

describe('metrics validation messages', () => {
  it('streak: required, integer, > 0', () => {
    const u = unitFor.streak
    expect(validateMetricValue('streak', u, null)).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('streak', u, 'abc')).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('streak', u, 1.5)).toBe(`${u} muss eine ganze Zahl sein`)
    expect(validateMetricValue('streak', u, 0)).toBe(`${u} muss > 0 sein`)
    expect(validateMetricValue('streak', u, 3)).toBeNull()
  })

  it('count_in_time: required, integer, > 0', () => {
    const u = unitFor.count_in_time
    expect(validateMetricValue('count_in_time', u, '')).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('count_in_time', u, 2.2)).toBe(`${u} muss eine ganze Zahl sein`)
    expect(validateMetricValue('count_in_time', u, 0)).toBe(`${u} muss > 0 sein`)
    expect(validateMetricValue('count_in_time', u, 5)).toBeNull()
  })

  it('points_total: required, integer, >= 0', () => {
    const u = unitFor.points_total
    expect(validateMetricValue('points_total', u, undefined)).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('points_total', u, 1.1)).toBe(`${u} muss eine ganze Zahl sein`)
    expect(validateMetricValue('points_total', u, -1)).toBe(`${u} muss ≥ 0 sein`)
    expect(validateMetricValue('points_total', u, 0)).toBeNull()
  })

  it('stations_cleared: required, integer, >= 0', () => {
    const u = unitFor.stations_cleared
    expect(validateMetricValue('stations_cleared', u, undefined)).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('stations_cleared', u, 2.5)).toBe(`${u} muss eine ganze Zahl sein`)
    expect(validateMetricValue('stations_cleared', u, -1)).toBe(`${u} muss ≥ 0 sein`)
    expect(validateMetricValue('stations_cleared', u, 1)).toBeNull()
  })

  it('corridor_hits: required, integer, >= 0', () => {
    const u = unitFor.corridor_hits
    expect(validateMetricValue('corridor_hits', u, undefined)).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('corridor_hits', u, 2.5)).toBe(`${u} muss eine ganze Zahl sein`)
    expect(validateMetricValue('corridor_hits', u, -1)).toBe(`${u} muss ≥ 0 sein`)
    expect(validateMetricValue('corridor_hits', u, 1)).toBeNull()
  })

  it('score_vs_par: required, integer (allow negatives)', () => {
    const u = unitFor.score_vs_par
    expect(validateMetricValue('score_vs_par', u, undefined)).toBe(`${u} wird benötigt`)
    expect(validateMetricValue('score_vs_par', u, 1.2)).toBe(`${u} muss eine ganze Zahl sein (z. B. -3, 0, 2)`)
    expect(validateMetricValue('score_vs_par', u, -5)).toBeNull()
    expect(validateMetricValue('score_vs_par', u, 0)).toBeNull()
    expect(validateMetricValue('score_vs_par', u, 7)).toBeNull()
  })
})
