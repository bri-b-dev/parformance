import type { BackupData } from '@/backup/format'

export interface DataSummary {
  sessions: number
  rounds: number
  collections: number
  focus: number
  favorites: number
  courseTemplates: number
  achievements: number
  hcpHistory: number
  /** Earliest and latest day among sessions and rounds. */
  firstDate: string | null
  lastDate: string | null
  /** Span between them in whole months, at least 1 when there is anything. */
  months: number
}

const DAY = 86_400_000

export function summarize(data: BackupData): DataSummary {
  const days = [...data.sessions.map(s => s.date), ...data.rounds.map(r => r.date)]
    .map(d => Date.parse(d.slice(0, 10)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  const first = days[0]
  const last = days[days.length - 1]
  return {
    sessions: data.sessions.length,
    rounds: data.rounds.length,
    collections: data.collections.length,
    focus: data.focus.length,
    favorites: data.favorites.length,
    courseTemplates: data.courseTemplates.length,
    achievements: data.achievements.length,
    hcpHistory: data.hcpHistory.length,
    firstDate: days.length ? new Date(first).toISOString().slice(0, 10) : null,
    lastDate: days.length ? new Date(last).toISOString().slice(0, 10) : null,
    months: days.length ? Math.max(1, Math.round((last - first) / (30.44 * DAY))) : 0,
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "312 Sessions, 12 Runden, 3 Sammlungen - über 14 Monate" (parts with nothing in them are left out). */
export function describeSummary(s: DataSummary): string {
  const parts = [
    s.sessions ? plural(s.sessions, 'Session', 'Sessions') : '',
    s.rounds ? plural(s.rounds, 'Runde', 'Runden') : '',
    s.collections ? plural(s.collections, 'Sammlung', 'Sammlungen') : '',
    s.focus ? plural(s.focus, 'Fokus-Punkt', 'Fokus-Punkte') : '',
    s.favorites ? plural(s.favorites, 'Favorit', 'Favoriten') : '',
    s.courseTemplates ? plural(s.courseTemplates, 'Kursvorlage', 'Kursvorlagen') : '',
  ].filter(Boolean)
  if (parts.length === 0) return 'Keine Daten'
  const span = s.months > 0 ? ` - ${s.months === 1 ? 'über 1 Monat' : `über ${s.months} Monate`}` : ''
  return parts.join(', ') + span
}

export const isEmptyData = (s: DataSummary) => s.sessions + s.rounds + s.collections + s.focus + s.favorites + s.courseTemplates + s.achievements + s.hcpHistory === 0
