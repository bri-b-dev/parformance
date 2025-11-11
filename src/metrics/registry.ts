import type { Drill, MetricType } from '@/types'

// Descriptor for how to capture/enter a metric in the UI
export interface MetricUIBehavior {
  // Name/key of the component to render (kept as string to avoid tight coupling)
  component: string
  // Human-readable label for the input, usually the unit from the drill definition
  label: string
}

// Map each MetricType to a component key. Keep lightweight and UI-agnostic here.
const COMPONENT_BY_TYPE: Record<MetricType, string> = {
  streak: 'StreakInput',
  count_in_time: 'CountInTimeInput',
  points_total: 'PointsTotalInput',
  stations_cleared: 'StationsClearedInput',
  corridor_hits: 'CorridorHitsInput',
  score_vs_par: 'ScoreVsParInput',
}

/**
 * Returns the component key for a given metric type.
 */
export function getComponentForMetric(type: MetricType): string {
  return COMPONENT_BY_TYPE[type]
}

/**
 * Returns the UI behavior (component + label) for a given drill.
 * - Component depends on drill.metric.type
 * - Label is taken from drill.metric.unit (acceptance: "Returns unit label from drill")
 */
export function getMetricUIForDrill(drill: Drill): MetricUIBehavior {
  const component = getComponentForMetric(drill.metric.type)
  const label = drill.metric.unit
  return { component, label }
}

export default {
  getComponentForMetric,
  getMetricUIForDrill,
}
