import type { Drill, Session } from '@/types'
import { evaluateSessionLevel } from '@/hcp/evaluator'

/**
 * Build a lookup of drillId -> category for quick grouping.
 */
export function buildDrillCategoryMap(drills: Drill[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const d of drills || []) {
    if (d && d.id) map[d.id] = d.category
  }
  return map
}

/**
 * From a list of sessions, compute the latest (by date) levelReached per drill.
 * If a session has no levelReached, treat it as 0 for aggregation purposes.
 */
export function latestLevelByDrill(sessions: Session[], drills?: Drill[], mode: 'historical' | 'current' = 'historical'): Record<string, number> {
  const latest: Record<string, { date: string; level: number }> = {}
  const drillMap: Record<string, Drill> = {}
  if (Array.isArray(drills)) {
    for (const d of drills) {
      if (d?.id) drillMap[d.id] = d
    }
  }
  for (const s of sessions || []) {
    if (!s || !s.drillId || !s.date) continue
    let level = typeof s.levelReached === 'number' && isFinite(s.levelReached) ? s.levelReached : undefined
    if (level == null) {
      const drill = drillMap[s.drillId]
      if (drill) {
        level = evaluateSessionLevel(s, drill, mode)
      }
    }
    if (!Number.isFinite(level)) level = 0
    const cur = latest[s.drillId]
    if (!cur || s.date.localeCompare(cur.date) > 0) {
      latest[s.drillId] = { date: s.date, level: Number(level) }
    }
  }
  const out: Record<string, number> = {}
  for (const [drillId, v] of Object.entries(latest)) out[drillId] = v.level
  return out
}

/** Normalize a 0–3 level to a 0–100 percentage. */
export function levelToPct(level: number): number {
  const l = Math.max(0, Math.min(3, Math.floor(level)))
  return (l / 3) * 100
}

/**
 * Compute normalized average of last level ratings per category.
 * - For each drill, take the latest session's levelReached (missing → 0).
 * - Group drills by their category and average the normalized percentage (0–100).
 * - Categories with no drills with sessions are returned as 0.
 *
 * Returns a map: { [category]: percentage0to100 }
 */
export function computeCategoryScores(sessions: Session[], drills: Drill[], mode: 'historical' | 'current' = 'historical'): Record<string, number> {
  const catByDrill = buildDrillCategoryMap(drills)
  const lastLevel = latestLevelByDrill(sessions, drills, mode)

  // Collect categories present in drills
  const categories = new Set<string>()
  for (const d of drills || []) categories.add(d.category)

  // Aggregate
  const sum: Record<string, number> = {}
  const count: Record<string, number> = {}

  for (const [drillId, lvl] of Object.entries(lastLevel)) {
    const cat = catByDrill[drillId]
    if (!cat) continue
    const pct = levelToPct(lvl)
    sum[cat] = (sum[cat] ?? 0) + pct
    count[cat] = (count[cat] ?? 0) + 1
  }

  // Produce results for all known categories; default to 0
  const out: Record<string, number> = {}
  for (const cat of Array.from(categories)) {
    if ((count[cat] ?? 0) > 0) out[cat] = sum[cat] / count[cat]
    else out[cat] = 0
  }
  return out
}

export default { buildDrillCategoryMap, latestLevelByDrill, levelToPct, computeCategoryScores }
