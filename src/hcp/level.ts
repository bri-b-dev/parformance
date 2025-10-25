import type { Drill } from '@/types'
import { findBucketKey } from '@/hcp/buckets'

/**
 * Compute the level (0–3) reached for a given result value using HCP bucket thresholds.
 * - hcpTargets: Record<rangeKey, [L1, L2, L3]>
 * - hcp: user handicap used to pick the bucket (supports keys like "54-27" or "54–27")
 * - value: numeric result to compare
 *
 * Returns:
 * - 0 when no thresholds matched (or inputs invalid)
 * - 1 when value >= L1 (but < L2)
 * - 2 when value >= L2 (but < L3)
 * - 3 when value >= L3
 */
export function computeLevelReached(
  hcp: number | null | undefined,
  hcpTargets: Record<string, number[]>,
  value: number | null | undefined,
): 0 | 1 | 2 | 3 {
  if (typeof value !== 'number' || !isFinite(value)) return 0
  const key = (typeof hcp === 'number') ? findBucketKey(hcp, hcpTargets || {}) : null
  const thresholds = key ? (hcpTargets?.[key] ?? []) : []

  // Normalize to three numbers (can be undefined); ignore non-finite entries
  const L1 = (typeof thresholds[0] === 'number' && isFinite(thresholds[0])) ? thresholds[0] : Infinity
  const L2 = (typeof thresholds[1] === 'number' && isFinite(thresholds[1])) ? thresholds[1] : Infinity
  const L3 = (typeof thresholds[2] === 'number' && isFinite(thresholds[2])) ? thresholds[2] : Infinity

  // Compare against ascending thresholds; if a threshold is Infinity (missing), it will not be reached
  if (value >= L3) return 3
  if (value >= L2) return 2
  if (value >= L1) return 1
  return 0
}

/** Convenience wrapper using a Drill object */
export function computeLevelForDrill(drill: Drill, hcp: number | null | undefined, value: number | null | undefined): 0 | 1 | 2 | 3 {
  return computeLevelReached(hcp, drill.metric?.hcpTargets || {}, value)
}

export default { computeLevelReached, computeLevelForDrill }
