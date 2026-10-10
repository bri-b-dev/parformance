import type { Drill } from '@/types'
import { resolveThresholds } from '@/hcp/buckets'
import { computeLevelFromThresholds, valueForLevel } from '@/hcp/level'

export interface ResultSummary {
  value: number
  unit: string
  /** 0-3, or null when no handicap or no thresholds are known. */
  level: number | null
  /** e.g. "noch +2 bis ★★", "Höchste Stufe erreicht" or a hint; null if nothing useful to say. */
  nextText: string | null
  /** Better than every earlier result of this drill (never on the first one). */
  isPb: boolean
  best: number | null
  /** value - best (raw difference, sign as is) */
  bestDelta: number | null
  /** Mean of up to the last 5 earlier results. */
  average: number | null
  averageDelta: number | null
  smallerIsBetter: boolean
}

export function isSmallerBetter(drill: Drill): boolean {
  return !!drill.metric?.smallerIsBetter || drill.metric?.type === 'score_vs_par'
}

/** Number with a decimal comma and at most one decimal. */
export function fmtNumber(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',')
}

/**
 * Everything the completion sheet shows about a just-saved result.
 * `previousValues` are the earlier results of the drill, oldest first, without the new one.
 */
export function summarizeResult(input: { drill: Drill; value: number; previousValues: number[]; hcp: number | null }): ResultSummary {
  const { drill, value, hcp } = input
  const smaller = isSmallerBetter(drill)
  const prev = input.previousValues.filter(v => Number.isFinite(v))

  const thr = hcp === null ? [] : resolveThresholds(drill.metric?.hcpTargets, hcp)
  const level = thr.length ? computeLevelFromThresholds(thr, value, !!drill.metric?.smallerIsBetter) : null

  let nextText: string | null = null
  if (hcp === null) {
    nextText = 'Trage dein Handicap ein, um dein Level zu sehen.'
  } else if (level !== null) {
    if (level >= Math.min(3, thr.length)) {
      nextText = 'Höchste Stufe erreicht'
    } else {
      const needed = valueForLevel(thr, (level + 1) as 1 | 2 | 3, !!drill.metric?.smallerIsBetter)
      if (needed !== null) {
        const gap = smaller ? value - needed : needed - value
        if (gap > 0) nextText = `noch ${smaller ? '−' : '+'}${fmtNumber(gap)} bis ${'★'.repeat(level + 1)}`
      }
    }
  }

  const better = (a: number, b: number) => (smaller ? a < b : a > b)
  const best = prev.length ? prev.reduce((b, v) => (better(v, b) ? v : b)) : null
  const last5 = prev.slice(-5)
  const average = last5.length ? last5.reduce((a, b) => a + b, 0) / last5.length : null

  return {
    value,
    unit: drill.metric.unit,
    level,
    nextText,
    isPb: best !== null && better(value, best),
    best,
    bestDelta: best === null ? null : value - best,
    average,
    averageDelta: average === null ? null : value - average,
    smallerIsBetter: smaller,
  }
}
