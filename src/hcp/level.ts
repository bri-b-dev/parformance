import type { Drill } from '@/types'
import { findBucketKey } from '@/hcp/buckets'

/**
 * Compute the level (0–3) reached for a given result value using HCP bucket thresholds.
 * - hcpTargets: Record<rangeKey, [L1, L2, L3]>
 * - hcp: user handicap used to pick the bucket (supports keys like "54-27" or "54-27")
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
  smallerIsBetter?: boolean,
): 0 | 1 | 2 | 3 {
  if (typeof value !== 'number' || !isFinite(value)) return 0
  const key = (typeof hcp === 'number') ? findBucketKey(hcp, hcpTargets || {}) : null
  const rawThresholds = key != null ? (hcpTargets?.[key]) : undefined
  const array = Array.isArray(rawThresholds)
    ? rawThresholds
    : (rawThresholds == null ? [] : [rawThresholds])

  // Normalize to ascending numeric thresholds (fill missing with Infinity)
  const thresholds = array
    .slice(0, 3)
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
    .sort((a, b) => a - b)

  while (thresholds.length < 3) thresholds.push(Infinity)

  const [L1, L2, L3] = thresholds

  // If smallerIsBetter is true, lower metric values correspond to higher levels
  if (smallerIsBetter) {
    if (value <= L1) return 3
    if (value <= L2) return 2
    if (value <= L3) return 1
    return 0
  }

  // Default: greater is better
  if (value >= L3) return 3
  if (value >= L2) return 2
  if (value >= L1) return 1
  return 0
}

/** Convenience wrapper using a Drill object */
export function computeLevelForDrill(drill: Drill, hcp: number | null | undefined, value: number | null | undefined): 0 | 1 | 2 | 3 {
  const smaller = !!drill?.metric?.smallerIsBetter
  return computeLevelReached(hcp, drill.metric?.hcpTargets || {}, value, smaller)
}

export default { computeLevelReached, computeLevelForDrill }
