import type { MetricType, Drill } from '@/types'

export interface ValidationResult {
  valid: boolean
  message: string | null
}

/**
 * Validate a numeric input for a given metric type and unit label.
 * Returns null message when valid, otherwise a human-friendly, unit-aware error.
 */
export function validateMetricValue(type: MetricType, unit: string, value: unknown): string | null {
  // Normalize
  const num = typeof value === 'string' ? Number(value) : (value as number)

  // Required check
  if (value === '' || value == null || Number.isNaN(num)) {
    return `${unit} wird benötigt`
  }

  // Integer check (all metrics use integers in MVP)
  if (!Number.isInteger(num)) {
    switch (type) {
      case 'score_vs_par':
        return `${unit} muss eine ganze Zahl sein (z. B. -3, 0, 2)`
      default:
        return `${unit} muss eine ganze Zahl sein`
    }
  }

  // Range checks per type
  switch (type) {
    case 'streak':
    case 'count_in_time':
      if (num <= 0) return `${unit} muss > 0 sein`
      break
    case 'points_total':
    case 'stations_cleared':
    case 'corridor_hits':
      if (num < 0) return `${unit} muss ≥ 0 sein`
      break
    case 'score_vs_par':
      // allow negatives, no lower/upper bound
      // already validated integer above
      break
  }

  return null
}

/** Helper to validate directly from a Drill object */
export function validateDrillResult(drill: Drill, value: unknown): string | null {
  return validateMetricValue(drill.metric.type, drill.metric.unit, value)
}

export default { validateMetricValue, validateDrillResult }
