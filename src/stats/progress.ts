import type { Drill, Session } from '@/types'
import type { AreasResult } from '@/stats/areas'
import { computeCategoryScores } from '@/stats/categoryScores'
import { personalBestIds } from '@/history/entries'
import { fmtNumber } from '@/session/summary'
import { drillMinutes } from '@/today/suggest'

export const PERIOD_OPTIONS = [
  { value: 7, label: '7 Tage' },
  { value: 30, label: '30 Tage' },
  { value: 90, label: '90 Tage' },
  { value: 0, label: 'Alles' },
]

const DAY = 86_400_000

const inRange = (s: Session, from: number, to: number) => {
  const t = Date.parse(s.date)
  return !Number.isNaN(t) && t >= from && t < to
}

/** Sessions of the last `days` days (0 = all), optionally limited to drills of one category. */
export function filterSessions(sessions: Session[], drills: Drill[], opts: { days: number; category?: string; now?: Date }): Session[] {
  const now = (opts.now ?? new Date()).getTime()
  const allowed = opts.category ? new Set(drills.filter(d => d.category === opts.category).map(d => d.id)) : null
  return sessions.filter(s => (!allowed || allowed.has(s.drillId)) && (opts.days > 0 ? inRange(s, now - opts.days * DAY, now + 1) : !Number.isNaN(Date.parse(s.date))))
}

export interface Kpis {
  sessions: number
  /** Sessions per week over the period (for "all": since the first session, at least one week); null without sessions. */
  perWeek: number | null
  minutes: number
  /** True if some minutes are the planned duration because no timer was used. */
  minutesEstimated: boolean
  pbs: number
  drills: number
}

/**
 * Key figures for the sessions of a period. PBs are judged against the full history so a short period
 * does not turn old results into "new" bests.
 */
export function computeKpis(input: { periodSessions: Session[]; allSessions: Session[]; drills: Drill[]; days: number; now?: Date }): Kpis {
  const now = (input.now ?? new Date()).getTime()
  const list = input.periodSessions
  const byId = new Map(input.drills.map(d => [d.id, d]))

  let seconds = 0
  let estimated = false
  for (const s of list) {
    if (typeof s.timerUsed === 'number' && s.timerUsed > 0) seconds += s.timerUsed
    else {
      const d = byId.get(s.drillId)
      seconds += (d ? drillMinutes(d) : 10) * 60
      estimated = true
    }
  }

  let perWeek: number | null = null
  if (list.length) {
    const first = Math.min(...list.map(s => Date.parse(s.date)))
    const weeks = input.days > 0 ? input.days / 7 : Math.max(1, (now - first) / (7 * DAY))
    perWeek = list.length / weeks
  }

  const pb = personalBestIds(input.allSessions, input.drills)
  return {
    sessions: list.length,
    perWeek,
    minutes: Math.round(seconds / 60),
    minutesEstimated: estimated,
    pbs: list.filter(s => pb.has(s.id)).length,
    drills: new Set(list.map(s => s.drillId)).size,
  }
}

export interface CategoryRow {
  category: string
  score: number
  /** Score of the previous period of the same length; null if there is no comparison. */
  previous: number | null
  /** score - previous in percentage points */
  delta: number | null
  hasData: boolean
}

/**
 * Score per category for the current period and, for 7/30/90 days, the equally long period before it.
 * Categories without sessions in the period keep a score of 0 and are marked as having no data.
 */
export function categoryRows(input: { sessions: Session[]; drills: Drill[]; days: number; mode: 'current' | 'historical'; now?: Date }): CategoryRow[] {
  const now = (input.now ?? new Date()).getTime()
  const byId = new Map(input.drills.map(d => [d.id, d]))
  const cur = input.days > 0 ? input.sessions.filter(s => inRange(s, now - input.days * DAY, now + 1)) : input.sessions
  const prev = input.days > 0 ? input.sessions.filter(s => inRange(s, now - 2 * input.days * DAY, now - input.days * DAY)) : null

  const scores = computeCategoryScores(cur, input.drills, input.mode)
  const prevScores = prev ? computeCategoryScores(prev, input.drills, input.mode) : null
  const withData = (list: Session[]) => new Set(list.map(s => byId.get(s.drillId)?.category).filter((c): c is string => !!c))
  const curCats = withData(cur)
  const prevCats = prev ? withData(prev) : new Set<string>()

  return Object.keys(scores).map(category => {
    const score = Math.round(scores[category])
    const previous = prevScores && prevCats.has(category) && curCats.has(category) ? Math.round(prevScores[category]) : null
    return { category, score, previous, delta: previous === null ? null : score - previous, hasData: curCats.has(category) }
  })
}

/** "▲ +12 Pkt ggü. dem Zeitraum davor" / "▼ -5 ..." / "► unverändert" / "kein Vergleich". */
export function trendText(row: Pick<CategoryRow, 'delta' | 'hasData'>): { symbol: string; text: string } {
  if (!row.hasData) return { symbol: '–', text: 'keine Sessions im Zeitraum' }
  if (row.delta === null) return { symbol: '–', text: 'kein Vergleich möglich' }
  if (row.delta > 0) return { symbol: '▲', text: `+${row.delta} Pkt ggü. dem Zeitraum davor` }
  if (row.delta < 0) return { symbol: '▼', text: `${String(row.delta).replace('-', '−')} Pkt ggü. dem Zeitraum davor` }
  return { symbol: '►', text: 'unverändert ggü. dem Zeitraum davor' }
}

export interface NextStep {
  drillId: string
  title: string
  /** One sentence: what is the situation. */
  text: string
  kind: 'target' | 'level' | 'stagnant'
}

/** The few drills that deserve attention next, each with a sentence about why. */
export function nextSteps(areas: AreasResult, drills: Drill[], opts: { targetHcp: number | null; limit?: number }): NextStep[] {
  const byId = new Map(drills.map(d => [d.id, d]))
  const title = (id: string, fallback?: string) => byId.get(id)?.title ?? fallback ?? id
  const hcp = opts.targetHcp === null ? '' : fmtNumber(opts.targetHcp)

  const steps: NextStep[] = areas.belowTarget.map(a => ({
    drillId: a.id,
    title: title(a.id, a.title),
    kind: a.targetValue != null ? ('target' as const) : ('level' as const),
    text: a.targetValue != null
      ? `${title(a.id, a.title)}: zuletzt ${fmtNumber(a.latestValue ?? 0)}, Ziel für HCP ${hcp} ist ${fmtNumber(a.targetValue)}.`
      : `${title(a.id, a.title)}: Level ${Math.round(a.latestLevel)} von 3, hier ist noch Luft nach oben.`,
  }))

  const listed = new Set(steps.map(s => s.drillId))
  for (const s of areas.stagnant) {
    if (listed.has(s.id)) continue
    steps.push({
      drillId: s.id,
      title: title(s.id, s.title),
      kind: 'stagnant',
      text: `${title(s.id, s.title)}: seit zehn Sessions kaum Veränderung (Level ${Math.round(s.latestLevel)} von 3), probier eine Variante.`,
    })
  }
  return steps.slice(0, opts.limit ?? 5)
}

export interface Improvement {
  drillId: string
  title: string
  text: string
}

/** Drills whose average over the last 5 sessions rose against the 5 before (at most `limit`). */
export function improvements(areas: AreasResult, drills: Drill[], limit = 3): Improvement[] {
  const byId = new Map(drills.map(d => [d.id, d]))
  return areas.mostImproved
    .filter(i => i.delta > 0)
    .slice(0, limit)
    .map(i => ({
      drillId: i.id,
      title: byId.get(i.id)?.title ?? i.title ?? i.id,
      text: `${byId.get(i.id)?.title ?? i.title ?? i.id}: Ø der letzten 5 Sessions +${fmtNumber(i.delta)} gegenüber den 5 davor.`,
    }))
}
