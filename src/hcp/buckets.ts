import type { Drill } from '@/types'

export interface HcpRow {
  key: string
  label: string // formatted with en dash, e.g., "26–12"
  values: number[]
  highlighted: boolean
  hi: number
  lo: number
}

/** Parse a range key like "54-27" into numeric hi/lo bounds. 
 * Tolerates whitespace and supports either hyphen-minus '-' or en dash '–'.
 */
export function parseRangeKey(key: string): { hi: number; lo: number } | null {
  if (!key) return null
  const normalized = String(key).trim().replace('–', '-')
  const m = normalized.match(/^\s*(\d{1,2})\s*-\s*(\d{1,2})\s*$/)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return { hi, lo }
}

/** Return the bucket key whose inclusive [lo, hi] contains the given hcp. */
export function findBucketKey(hcp: number, hcpTargets: Record<string, number[]>): string | null {
  if (typeof hcp !== 'number' || !isFinite(hcp)) return null
  let found: { key: string; hi: number; lo: number } | null = null
  for (const key of Object.keys(hcpTargets || {})) {
    const r = parseRangeKey(key)
    if (!r) continue
    if (hcp >= r.lo && hcp <= r.hi) {
      // pick the narrowest matching range if multiple (prefer smaller width)
      if (!found) found = { key, ...r }
      else {
        const widthFound = found.hi - found.lo
        const widthNew = r.hi - r.lo
        if (widthNew < widthFound) found = { key, ...r }
      }
    }
  }
  return found?.key ?? null
}

/** Format a key like "26-12" as a label with en dash ("26–12"). */
export function formatRangeLabel(key: string): string {
  return String(key).trim().replace('-', '–')
}

/** Build display rows for a compact table. Sorted by hi desc, then lo desc. */
export function buildHcpRows(
  hcpTargets: Record<string, number[]>,
  currentHcp: number | null | undefined
): HcpRow[] {
  const rows: HcpRow[] = []
  const matchKey = typeof currentHcp === 'number' ? findBucketKey(currentHcp, hcpTargets) : null
  for (const key of Object.keys(hcpTargets || {})) {
    const r = parseRangeKey(key)
    if (!r) continue
    const values = Array.isArray(hcpTargets[key]) ? hcpTargets[key] : []
    rows.push({
      key,
      label: formatRangeLabel(key),
      values,
      highlighted: key === matchKey,
      hi: r.hi,
      lo: r.lo,
    })
  }
  rows.sort((a, b) => (b.hi - a.hi) || (b.lo - a.lo))
  return rows
}

/** Convenience: Build rows directly from a Drill. */
export function buildRowsForDrill(drill: Drill, currentHcp: number | null | undefined): HcpRow[] {
  return buildHcpRows(drill.metric.hcpTargets || {}, currentHcp)
}

export default { parseRangeKey, findBucketKey, formatRangeLabel, buildHcpRows, buildRowsForDrill }
