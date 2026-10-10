import type { Drill, Session } from '@/types'

export interface HistoryEntry {
  session: Session
  /** undefined when the drill is no longer part of the catalog */
  drill: Drill | undefined
  level: number | null
  /** true if this session beat every earlier session of the same drill */
  isPb: boolean
}

export interface HistoryDay {
  /** Local day, YYYY-MM-DD */
  key: string
  entries: HistoryEntry[]
}

export interface HistoryResult {
  days: HistoryDay[]
  total: number
  drillCount: number
}

export interface HistoryOptions {
  category?: string
  /** Focus id, or 'none' for sessions without a focus. */
  focusId?: string
  /** Only sessions from the last N days (0 or undefined = all). */
  days?: number
  now?: Date
  levelOf?: (session: Session, drill: Drill) => number | null
}

export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function greaterIsBetter(drill: Drill | undefined): boolean {
  if (!drill) return true
  return !drill.metric?.smallerIsBetter && drill.metric?.type !== 'score_vs_par'
}

/** Session ids that were a personal best when they were played (first session of a drill never counts). */
export function personalBestIds(sessions: Session[], drills: Drill[]): Set<string> {
  const byId = new Map(drills.map(d => [d.id, d]))
  const perDrill = new Map<string, Session[]>()
  for (const s of sessions) {
    if (!perDrill.has(s.drillId)) perDrill.set(s.drillId, [])
    perDrill.get(s.drillId)!.push(s)
  }
  const out = new Set<string>()
  for (const [drillId, list] of perDrill) {
    const greater = greaterIsBetter(byId.get(drillId))
    const asc = [...list].sort((a, b) => a.date.localeCompare(b.date))
    let best: number | null = null
    for (const s of asc) {
      const v = Number(s.result?.value)
      if (!Number.isFinite(v)) continue
      if (best !== null && (greater ? v > best : v < best)) out.add(s.id)
      if (best === null || (greater ? v > best : v < best)) best = v
    }
  }
  return out
}

/** All sessions newest first, grouped by local day, with optional category and period filter. */
export function buildHistory(sessions: Session[], drills: Drill[], opts: HistoryOptions = {}): HistoryResult {
  const now = opts.now ?? new Date()
  const byId = new Map(drills.map(d => [d.id, d]))
  const pb = personalBestIds(sessions, drills)
  const cutoff = opts.days && opts.days > 0 ? now.getTime() - opts.days * 86_400_000 : null

  const entries = sessions
    .filter(s => s.date && !Number.isNaN(Date.parse(s.date)))
    .filter(s => cutoff === null || Date.parse(s.date) >= cutoff)
    .filter(s => !opts.category || byId.get(s.drillId)?.category === opts.category)
    .filter(s => !opts.focusId || (opts.focusId === 'none' ? !s.focusId : s.focusId === opts.focusId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map<HistoryEntry>(session => {
      const drill = byId.get(session.drillId)
      return { session, drill, level: drill && opts.levelOf ? opts.levelOf(session, drill) : null, isPb: pb.has(session.id) }
    })

  const days: HistoryDay[] = []
  for (const e of entries) {
    const key = localDayKey(new Date(e.session.date))
    const last = days.at(-1)
    if (last && last.key === key) last.entries.push(e)
    else days.push({ key, entries: [e] })
  }
  return { days, total: entries.length, drillCount: new Set(entries.map(e => e.session.drillId)).size }
}

/** Keep only the first `max` entries (whole days are cut at entry level), e.g. for "show more" paging. */
export function limitHistory(result: HistoryResult, max: number): HistoryDay[] {
  const out: HistoryDay[] = []
  let left = max
  for (const day of result.days) {
    if (left <= 0) break
    const entries = day.entries.slice(0, left)
    out.push({ key: day.key, entries })
    left -= entries.length
  }
  return out
}

/** "Heute", "Gestern" or e.g. "Mo., 6. Okt. 2026" for a local day key. */
export function formatDayLabel(key: string, now: Date = new Date()): string {
  if (key === localDayKey(now)) return 'Heute'
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (key === localDayKey(y)) return 'Gestern'
  const [yy, mm, dd] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(yy, mm - 1, dd))
}
