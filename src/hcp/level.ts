import type { Drill } from '@/types'
import { resolveThresholds } from '@/hcp/buckets'

export type Level = 0 | 1 | 2 | 3

/**
 * Level = number of thresholds met (max 3). Thresholds are sorted from easiest to hardest.
 * Missing thresholds are never "met", so a drill with fewer than three never grants phantom levels.
 */
export function computeLevelFromThresholds(
  thresholds: number[] | undefined,
  value: number | null | undefined,
  smallerIsBetter?: boolean,
): Level {
  if (!Array.isArray(thresholds) || typeof value !== 'number' || !Number.isFinite(value)) return 0
  const thr = thresholds.map(Number).filter(Number.isFinite).slice(0, 3)
  // Greater-is-better: easiest threshold is the smallest. Smaller-is-better: the largest.
  const met = thr.filter(t => (smallerIsBetter ? value <= t : value >= t))
  return Math.min(3, met.length) as Level
}

export function computeLevelReached(
  hcp: number | null | undefined,
  hcpTargets: Record<string, number[]>,
  value: number | null | undefined,
  smallerIsBetter?: boolean,
): Level {
  return computeLevelFromThresholds(resolveThresholds(hcpTargets, hcp), value, smallerIsBetter)
}

export function computeLevelForDrill(drill: Drill, hcp: number | null | undefined, value: number | null | undefined): Level {
  return computeLevelReached(hcp, drill.metric?.hcpTargets || {}, value, !!drill?.metric?.smallerIsBetter)
}

/**
 * The result needed to reach `level` (1-3) with the given thresholds, or null if the drill has fewer levels.
 * Greater-is-better: easiest threshold first (ascending). Smaller-is-better: largest first (descending).
 */
export function valueForLevel(thresholds: number[] | undefined, level: 1 | 2 | 3, smallerIsBetter?: boolean): number | null {
  const thr = (thresholds ?? []).map(Number).filter(Number.isFinite).slice(0, 3).sort((a, b) => (smallerIsBetter ? b - a : a - b))
  return thr[level - 1] ?? null
}
