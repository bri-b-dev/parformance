import type { Drill, Session } from '@/types'
import { latestLevelByDrill } from '@/stats/categoryScores'
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
  opts?: { stagnantTolerance?: number }
): AreasResult {
  const tolerance = opts?.stagnantTolerance ?? 0.1

  const lastLevelMap = latestLevelByDrill(sessions || [])

  const drillById: Record<string, Drill> = {}
  for (const d of drills || []) drillById[d.id] = d

  const belowTarget: AreaDrill[] = []
  const stagnant: AreaDrill[] = []
  const improvements: Improvement[] = []

  for (const d of drills || []) {
    const id = d.id
    const latest = Number.isFinite(Number(lastLevelMap[id])) ? Number(lastLevelMap[id]) : 0

    // determine target level from drill.metric.hcpTargets using user's HCP bucket
    let targetLevel: number | undefined = undefined
    try {
      const bucket = findBucketKey(typeof userHcp === 'number' ? userHcp : NaN, d.metric?.hcpTargets ?? {})
      if (bucket) {
        const arr = (d.metric?.hcpTargets ?? {})[bucket]
        if (Array.isArray(arr) && arr.length) {
          // choose the maximum target as the goal
          targetLevel = Math.max(...arr.map(v => Number(v) || 0))
        }
      }
    } catch {}

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
    const delta = (maLast != null && maPrev != null) ? (maLast - maPrev) : 0
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
