import type { Drill, Session } from '@/types'
import { computeLevelForDrill } from '@/hcp/level'

export interface BelowTargetRow {
  drillId: string
  title: string
  considered: number
  below: number
  pctBelow: number // 0..100
}

function byDateDesc(a: Session, b: Session): number {
  // Use ISO string localeCompare for deterministic desc order
  return b.date.localeCompare(a.date)
}

/** Build a lookup map for quick drill resolution by id. */
export function buildDrillMap(drills: Drill[]): Record<string, Drill> {
  const map: Record<string, Drill> = {}
  for (const d of drills || []) {
    if (d && d.id) map[d.id] = d
  }
  return map
}

/**
 * Compute drills that are frequently below target over the last N sessions per drill.
 * - "Below target" is defined as levelReached === 0.
 * - For sessions missing levelReached, we compute it from the drill + hcp + result.value.
 * - Considers up to N recent sessions per drill (sorted by date desc). Defaults to N=5.
 * - Returns rows sorted by pctBelow desc, then by considered desc, then by title asc for stability.
 */
export function computeFrequentlyBelowTarget(
  sessions: Session[],
  drills: Drill[],
  hcp: number | null | undefined,
  N: number = 5
): BelowTargetRow[] {
  if (!Array.isArray(sessions) || !Array.isArray(drills) || drills.length === 0) return []
  const n = Math.max(1, Math.floor(N || 5))
  const byDrill: Record<string, Session[]> = {}
  for (const s of sessions || []) {
    if (!s || !s.drillId || !s.date) continue
    if (!byDrill[s.drillId]) byDrill[s.drillId] = []
    byDrill[s.drillId].push(s)
  }

  const drillMap = buildDrillMap(drills)
  const rows: BelowTargetRow[] = []

  for (const [drillId, list] of Object.entries(byDrill)) {
    const drill = drillMap[drillId]
    if (!drill) continue // ignore sessions for unknown drills

    // Sort by date desc and take last N
    const recent = [...list].sort(byDateDesc).slice(0, n)
    const considered = recent.length
    if (considered === 0) continue

    let below = 0
    for (const s of recent) {
      const lvl = typeof s.levelReached === 'number' && isFinite(s.levelReached)
        ? s.levelReached
        : computeLevelForDrill(drill, hcp, Number(s.result?.value))
      if (!lvl) below += 1 // level 0
    }

    const pctBelow = considered > 0 ? (below / considered) * 100 : 0
    rows.push({ drillId, title: drill.title, considered, below, pctBelow })
  }

  // Sort by % below desc, then by considered desc, then by title asc
  rows.sort((a, b) => {
    if (b.pctBelow !== a.pctBelow) return b.pctBelow - a.pctBelow
    if (b.considered !== a.considered) return b.considered - a.considered
    return a.title.localeCompare(b.title)
  })

  return rows
}

export default { computeFrequentlyBelowTarget, buildDrillMap }
