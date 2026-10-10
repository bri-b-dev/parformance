import type { Drill } from '@/types'

export interface HcpRow {
  key: string
  label: string // formatted with en dash, e.g., "26-12"
  values: number[]
  highlighted: boolean
  /** True for the bucket that contains the target HCP. */
  isTarget: boolean
  hi: number
  lo: number
}

/** Parse a range key like "54-27" into numeric hi/lo bounds.
 * Tolerates whitespace and supports either hyphen-minus '-' or en dash '-'.
 */
export function parseRangeKey(key: string): { hi: number; lo: number } | null {
  if (!key) return null
  const normalized = String(key).trim().replace('-', '-')
  const m = /^\s*(\d{1,2})\s*-\s*(\d{1,2})\s*$/.exec(normalized)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return { hi, lo }
}

/** Return the bucket key whose inclusive [lo, hi] contains the given hcp. */
export function findBucketKey(hcp: number, hcpTargets: Record<string, number[]>): string | null {
  if (typeof hcp !== 'number' || !Number.isFinite(hcp)) return null
  let found: { key: string; hi: number; lo: number } | null = null
  for (const key of Object.keys(hcpTargets || {})) {
    const r = parseRangeKey(key)
    if (!r) continue
    if (hcp >= r.lo && hcp <= r.hi) {
      // pick the narrowest matching range if multiple (prefer smaller width)
      if (found) {
        const widthFound = found.hi - found.lo
        const widthNew = r.hi - r.lo
        if (widthNew < widthFound) found = { key, ...r }
      } else {
        found = { key, ...r }
      }
    }
  }
  return found?.key ?? null
}

/** Format a key like "26-12" as a label with en dash ("26-12"). */
export function formatRangeLabel(key: string): string {
  return String(key).trim().replace('-', '-')
}

/** Build display rows for a compact table. Sorted by hi desc, then lo desc. */
export function buildHcpRows(
  hcpTargets: Record<string, number[]>,
  currentHcp: number | null | undefined,
  targetHcp?: number | null
): HcpRow[] {
  const rows: HcpRow[] = []
  const matchKey = typeof currentHcp === 'number' ? findBucketKey(currentHcp, hcpTargets) : null
  const targetKey = typeof targetHcp === 'number' ? findBucketKey(targetHcp, hcpTargets) : null
  for (const key of Object.keys(hcpTargets || {})) {
    const r = parseRangeKey(key)
    if (!r) continue
    const raw = (hcpTargets as any)[key]
    let values: number[]
    if (Array.isArray(raw)) {
      values = raw.map(Number).filter(v => Number.isFinite(v))
    } else if (raw === null || raw === undefined) {
      values = []
    } else {
      values = [Number(raw)].filter(v => Number.isFinite(v))
    }
    rows.push({
      key,
      label: formatRangeLabel(key),
      values,
      highlighted: key === matchKey,
      isTarget: key === targetKey,
      hi: r.hi,
      lo: r.lo,
    })
  }
  rows.sort((a, b) => (b.hi - a.hi) || (b.lo - a.lo))
  return rows
}

/** Convenience: Build rows directly from a Drill. */
export function buildRowsForDrill(drill: Drill, currentHcp: number | null | undefined, targetHcp?: number | null): HcpRow[] {
  return buildHcpRows(drill.metric.hcpTargets || {}, currentHcp, targetHcp)
}

function toValues(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter(v => Number.isFinite(v))
  if (raw === null || raw === undefined) return []
  return [Number(raw)].filter(v => Number.isFinite(v))
}

/**
 * Single source of truth for "which thresholds apply to this handicap".
 * Uses the bucket containing the hcp; if the hcp falls into a gap between buckets
 * (or outside all of them), the nearest bucket is used. Returns [] without usable input.
 */
export function resolveThresholds(hcpTargets: Record<string, number[]> | undefined, hcp: number | null | undefined): number[] {
  if (typeof hcp !== 'number' || !Number.isFinite(hcp)) return []
  const targets = hcpTargets || {}
  const key = findBucketKey(hcp, targets)
  if (key != null) return toValues(targets[key])
  let best: { key: string; dist: number } | null = null
  for (const k of Object.keys(targets)) {
    const r = parseRangeKey(k)
    if (!r) continue
    const dist = hcp < r.lo ? r.lo - hcp : hcp - r.hi
    if (!best || dist < best.dist) best = { key: k, dist }
  }
  return best ? toValues(targets[best.key]) : []
}
