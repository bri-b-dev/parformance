import { describe, it, expect } from 'vitest'
import { getComponentForMetric, getMetricUIForDrill } from '../../src/metrics/registry'
import type { Drill, MetricType } from '../../src/types'

const makeDrill = (type: MetricType, unit: string): Drill => ({
  id: `d_${type}`,
  title: `Drill ${type}`,
  category: 'Test',
  equipment: {},
  setup: { schema: 'x' },
  duration: {},
  instructions: { training: 'do it' },
  metric: { type, unit, hcpTargets: {} },
})

describe('metrics registry', () => {
  it('maps each MetricType to a component and returns unit label from drill', () => {
    const cases: Array<[MetricType, string, string]> = [
      ['streak', 'StreakInput', 'Zonen in Serie'],
      ['count_in_time', 'CountInTimeInput', 'Treffer in 60s'],
      ['points_total', 'PointsTotalInput', 'Punkte'],
      ['stations_cleared', 'StationsClearedInput', 'Stationen'],
      ['corridor_hits', 'CorridorHitsInput', 'Treffer'],
      ['score_vs_par', 'ScoreVsParInput', 'Score'],
    ]

    for (const [type, expectedComponent, unit] of cases) {
      // component mapping
      expect(getComponentForMetric(type)).toBe(expectedComponent)

      const drill = makeDrill(type, unit)
      const ui = getMetricUIForDrill(drill)
      expect(ui.component).toBe(expectedComponent)
      expect(ui.label).toBe(unit)
    }
  })
})
