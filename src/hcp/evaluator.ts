import type { Drill, Session } from '@/types'
import { parseRangeKey } from '@/hcp/buckets'
import { useHcpHistoryStore } from '@/stores/hcpHistory'

type BucketRow = { key: string; hi: number; lo: number; midpoint: number; values: number[] }

function buildBuckets(hcpTargets: Record<string, any>): BucketRow[] {
  const rows: BucketRow[] = []
  for (const key of Object.keys(hcpTargets || {})) {
    const r = parseRangeKey(key)
    if (!r) continue
    const raw = (hcpTargets as any)[key]
    let values: number[] = []
    if (Array.isArray(raw)) values = raw.map(Number).filter(v => Number.isFinite(v))
    else if (raw == null) values = []
    else values = [Number(raw)].filter(v => Number.isFinite(v))
    const midpoint = (r.hi + r.lo) / 2
    rows.push({ key, hi: r.hi, lo: r.lo, midpoint, values })
  }
  // sort by midpoint ascending
  rows.sort((a, b) => a.midpoint - b.midpoint)
  return rows
}

/**
 * Interpolate target values for an arbitrary hcp using bucket midpoints.
 * If hcp is outside the known buckets, clamp to nearest.
 */
export function interpolateTargets(hcpTargets: Record<string, any>, hcp: number | null | undefined): number[] {
  const rows = buildBuckets(hcpTargets || {})
  if (!rows.length || typeof hcp !== 'number' || !Number.isFinite(hcp)) return []
  if (rows.length === 1) return rows[0].values.slice()
  const midpoints = rows.map(r => r.midpoint)
  if (hcp <= midpoints[0]) return rows[0].values.slice()
  if (hcp >= midpoints[midpoints.length - 1]) return rows[rows.length - 1].values.slice()
  // find interval
  let idx = 0
  for (let i = 0; i < rows.length - 1; i++) {
    if (hcp >= rows[i].midpoint && hcp <= rows[i + 1].midpoint) { idx = i; break }
  }
  const a = rows[idx]
  const b = rows[idx + 1]
  const t = (hcp - a.midpoint) / (b.midpoint - a.midpoint)
  const maxLen = Math.max(a.values.length, b.values.length)
  const out: number[] = []
  for (let i = 0; i < maxLen; i++) {
    const va = Number.isFinite(Number(a.values[i])) ? Number(a.values[i]) : NaN
    const vb = Number.isFinite(Number(b.values[i])) ? Number(b.values[i]) : NaN
    if (!Number.isFinite(va) && !Number.isFinite(vb)) {
      out.push(NaN)
      continue
    }
    const vala = Number.isFinite(va) ? va : vb
    const valb = Number.isFinite(vb) ? vb : va
    const v = vala + (valb - vala) * t
    out.push(v)
  }
  return out
}

/** Compute level (0..3) from numeric thresholds (values array) and a measured value. */
export function computeLevelFromThresholds(thresholds: number[] | undefined, value: number | null | undefined, smallerIsBetter?: boolean): 0 | 1 | 2 | 3 {
  if (!Array.isArray(thresholds) || thresholds.length === 0) return 0
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  // Normalize to three ascending numeric thresholds
  const thr = thresholds.map(Number).filter(v => Number.isFinite(v)).slice(0, 3).sort((a, b) => a - b)
  while (thr.length < 3) thr.push(Infinity)
  const [L1, L2, L3] = thr
  if (smallerIsBetter) {
    if (value <= L1) return 3
    if (value <= L2) return 2
    if (value <= L3) return 1
    return 0
  }
  if (value >= L3) return 3
  if (value >= L2) return 2
  if (value >= L1) return 1
  return 0
}

/**
 * Evaluate a session's level using the chosen mode.
 * - mode 'historical' : prefer session.levelReached if present, otherwise use hcp_history.getHcpAt(session.date)
 * - mode 'current' : evaluate using the latest hcp from hcp_history
 */
export function evaluateSessionLevel(session: Session, drill: Drill | undefined, mode: 'historical' | 'current' = 'historical'): 0 | 1 | 2 | 3 {
  if (!drill) return 0
  // If the session already has a recorded levelReached, treat that as immutable historical snapshot
  if (mode === 'historical' && typeof session.levelReached === 'number' && Number.isFinite(session.levelReached)) {
    return Math.max(0, Math.min(3, Math.floor(session.levelReached))) as 0 | 1 | 2 | 3
  }
  const hstore = useHcpHistoryStore()
  let hcp: number | null | undefined = null
  if (mode === 'historical') {
    hcp = hstore.getHcpAt(session.date)
  } else {
    hcp = hstore.getLatestHcp()
  }
  const thresholds = interpolateTargets(drill.metric?.hcpTargets || {}, hcp)
  const val = Number(session.result?.value)
  return computeLevelFromThresholds(thresholds, val, Boolean(drill.metric?.smallerIsBetter))
}

export default { interpolateTargets, computeLevelFromThresholds, evaluateSessionLevel }
