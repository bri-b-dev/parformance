import { computeLevelFromThresholds } from '@/hcp/level'

export interface ScaleMarker {
  level: 1 | 2 | 3
  value: number
  /** 0..1 along the scale, better results are always further right */
  pos: number
}

export interface ScaleModel {
  /** Level markers, level 1 first */
  markers: ScaleMarker[]
  bestPos: number | null
  lastPos: number | null
  /** Level reached by the best result (0 without result) */
  level: number
  maxLevel: number
  /** The next level above the best result, null when the top is reached */
  next: { level: number; value: number; gap: number } | null
  smallerIsBetter: boolean
}

export interface ScaleInput {
  thresholds: number[]
  smallerIsBetter: boolean
  best: number | null
  last: number | null
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Geometry and next-step numbers for the target scale of a drill.
 * Thresholds are the results needed for level 1..3. For "smaller is better" drills the scale is
 * mirrored so that better results are always to the right.
 */
export function buildScale(input: ScaleInput): ScaleModel | null {
  const smaller = input.smallerIsBetter
  const thr = input.thresholds.filter(Number.isFinite).slice(0, 3).sort((a, b) => (smaller ? b - a : a - b))
  if (thr.length === 0) return null

  const observed = [input.best, input.last].filter((v): v is number => v !== null && Number.isFinite(v))
  const first = thr[0]
  const lastThr = thr[thr.length - 1]
  const span = Math.abs(lastThr - first)
  const pad = Math.max(1, span * 0.25)

  // domain [from (left) .. to (right)]
  let from: number
  let to: number
  if (smaller) {
    from = Math.max(first + pad * 2, ...observed)
    to = Math.min(lastThr - pad, ...observed)
  } else {
    from = Math.min(0, first, ...observed)
    to = Math.max(lastThr + pad, ...observed)
  }
  if (from === to) to = from + 1
  const pos = (v: number) => clamp01((v - from) / (to - from))

  const markers = thr.map((value, i) => ({ level: (i + 1) as 1 | 2 | 3, value, pos: pos(value) }))
  const best = input.best
  const level = best === null ? 0 : computeLevelFromThresholds(thr, best, smaller)
  const maxLevel = thr.length

  let next: ScaleModel['next'] = null
  if (level < maxLevel) {
    const target = thr[level]
    next = { level: level + 1, value: target, gap: best === null ? Math.abs(target) : smaller ? best - target : target - best }
  }

  return {
    markers,
    bestPos: best === null ? null : pos(best),
    lastPos: input.last === null ? null : pos(input.last),
    level,
    maxLevel,
    next,
    smallerIsBetter: smaller,
  }
}
