import type { Drill, Session } from '@/types'
import { latestLevelByDrill } from '@/stats/categoryScores'
import { interpolateTargets, evaluateSessionLevel } from '@/hcp/evaluator'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { getMovingAverageTrend } from '@/stats/movingAverage'
import { findBucketKey } from '@/hcp/buckets'

export type AreaDrill = {
  id: string
  title?: string
  category?: string
  latestLevel: number
  targetLevel?: number
  gap?: number
}

export type Improvement = {
  id: string
  title?: string
  category?: string
  maPrev5: number | null
  maLast5: number | null
  delta: number
}

export interface AreasResult {
  belowTarget: AreaDrill[]
  stagnant: AreaDrill[]
  mostImproved: Improvement[]
}

export function computeAreasOfImprovement(
  sessions: Session[],
  drills: Drill[],
  userHcp: number | null | undefined,
  opts?: { stagnantTolerance?: number; mode?: 'historical' | 'current' }
): AreasResult {
  const tolerance = opts?.stagnantTolerance ?? 0.1

  const mode = opts?.mode ?? 'current'
  const lastLevelMap = latestLevelByDrill(sessions || [], drills || [], mode)
  const hstore = useHcpHistoryStore()

  const drillById: Record<string, Drill> = {}
  for (const d of drills || []) drillById[d.id] = d

  const belowTarget: AreaDrill[] = []
  const stagnant: AreaDrill[] = []
  const improvements: Improvement[] = []

  for (const d of drills || []) {
    const id = d.id
    const hasSession = Object.prototype.hasOwnProperty.call(lastLevelMap, id)
    if (!hasSession) continue
    const latest = Number.isFinite(Number(lastLevelMap[id])) ? Number(lastLevelMap[id]) : 0

    // determine target level from drill.metric.hcpTargets using either current or historical HCP
    let targetLevel: number | undefined = undefined
    try {
      let effectiveHcp: number | null | undefined = null
      if (mode === 'current') {
        effectiveHcp = hstore.getLatestHcp()
      } else {
        // historical: find the most recent session for this drill and use the HCP valid at that session
        const sessionsForDrill = (sessions || []).filter(s => s.drillId === id && s.date)
        if (sessionsForDrill.length > 0) {
          // pick the latest by date
          sessionsForDrill.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          const latestSess = sessionsForDrill[sessionsForDrill.length - 1]
          effectiveHcp = hstore.getHcpAt(latestSess.date)
        } else {
          effectiveHcp = userHcp
        }
      }
      const thresholds = interpolateTargets(d.metric?.hcpTargets ?? {}, effectiveHcp)
      if (Array.isArray(thresholds) && thresholds.length > 0) {
        targetLevel = Math.min(3, thresholds.length)
      }
    } catch (e) {
      // ignore
    }

    if (typeof targetLevel === 'number' && Number.isFinite(targetLevel)) {
      const gap = targetLevel - latest
      if (gap > 0) {
        belowTarget.push({ id, title: d.title, category: d.category, latestLevel: latest, targetLevel, gap })
      }
    }

    // compute trend via moving average
  const vals = (sessions || []).filter(s => s.drillId === id).map(s => Number(s.result?.value)).filter(v => Number.isFinite(v))
    const trend = getMovingAverageTrend(vals)
    const maLast = trend.maLast5
    const maPrev = trend.maPrev5
    // For drills where smaller metric values are better (e.g. time, strokes),
    // an improvement is represented by a decrease in the moving average.
    const smallerIsBetter = Boolean(d.metric?.smallerIsBetter)
    const delta = (maLast != null && maPrev != null) ? (smallerIsBetter ? (maPrev - maLast) : (maLast - maPrev)) : 0
    if (maLast != null && maPrev != null && Math.abs(delta) <= tolerance) {
      stagnant.push({ id, title: d.title, category: d.category, latestLevel: latest })
    }

    improvements.push({ id, title: d.title, category: d.category, maPrev5: maPrev, maLast5: maLast, delta })
  }

  // sort belowTarget by gap desc
  belowTarget.sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))

  // filter improvements to entries with numeric delta and sort by delta desc
  const mostImproved = improvements
    .filter(i => i.maPrev5 != null && i.maLast5 != null)
    .sort((a, b) => b.delta - a.delta)

  return { belowTarget, stagnant, mostImproved }
}

export default { computeAreasOfImprovement }
