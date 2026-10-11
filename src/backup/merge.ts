import type { BackupData, BackupRound, BackupSettings, BackupTemplate } from '@/backup/format'

export interface MergeCounts {
  sessions: number
  rounds: number
  collections: number
  focus: number
  favorites: number
  courseTemplates: number
  achievements: number
  hcpHistory: number
}

export const roundKey = (r: BackupRound) => `${r.date.slice(0, 10)}|${r.courseName}|${r.grossScore}`
export const templateKey = (t: BackupTemplate) => `${t.name}|${t.tee}|${t.holes}|${t.courseRating}|${t.slope}`

/** Union by key; what is already there wins. Also returns how many entries are new. */
function union<T>(current: T[], incoming: T[], key: (x: T) => string): { list: T[]; added: number } {
  const seen = new Set(current.map(key))
  const list = [...current]
  let added = 0
  for (const x of incoming) {
    const k = key(x)
    if (seen.has(k)) continue
    seen.add(k)
    list.push(x)
    added++
  }
  return { list, added }
}

function mergeSettings(current: BackupSettings | null, incoming: BackupSettings | null): BackupSettings | null {
  if (!current) return incoming
  if (!incoming) return current
  // current preferences win; only gaps are filled from the backup
  return { ...current, hcp: current.hcp ?? incoming.hcp, targetHcp: current.targetHcp ?? incoming.targetHcp, targetDate: current.targetDate ?? incoming.targetDate, name: current.name || incoming.name }
}

/**
 * "Zusammenführen": keep everything that is on the device and add what the backup has that is new.
 * Sessions, collections, focus points and achievements match by id, rounds by day + course + score,
 * course templates by their values, favorites by drill. Settings stay as they are (gaps are filled).
 */
export function mergeData(current: BackupData, incoming: BackupData): { merged: BackupData; added: MergeCounts } {
  const sessions = union(current.sessions, incoming.sessions, s => s.id)
  const collections = union(current.collections, incoming.collections, c => c.id)
  const focus = union(current.focus, incoming.focus, f => f.id)
  const achievements = union(current.achievements, incoming.achievements, a => a.id)
  const rounds = union(current.rounds, incoming.rounds, roundKey)
  const templates = union(current.courseTemplates, incoming.courseTemplates, templateKey)
  const favorites = union(current.favorites, incoming.favorites, f => f)
  const history = union(current.hcpHistory, incoming.hcpHistory, r => `${r.valid_from}|${r.hcp}`)

  return {
    merged: {
      settings: mergeSettings(current.settings, incoming.settings),
      favorites: favorites.list,
      sessions: sessions.list,
      hcpHistory: history.list.sort((a, b) => a.valid_from.localeCompare(b.valid_from)),
      collections: collections.list,
      focus: focus.list,
      achievements: achievements.list,
      rounds: rounds.list,
      courseTemplates: templates.list,
    },
    added: {
      sessions: sessions.added, rounds: rounds.added, collections: collections.added, focus: focus.added, favorites: favorites.added,
      courseTemplates: templates.added, achievements: achievements.added, hcpHistory: history.added,
    },
  }
}

export function describeAdded(a: MergeCounts): string {
  const p = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  const parts = [
    a.sessions ? p(a.sessions, 'Session', 'Sessions') : '',
    a.rounds ? p(a.rounds, 'Runde', 'Runden') : '',
    a.collections ? p(a.collections, 'Sammlung', 'Sammlungen') : '',
    a.focus ? p(a.focus, 'Fokus-Punkt', 'Fokus-Punkte') : '',
    a.favorites ? p(a.favorites, 'Favorit', 'Favoriten') : '',
    a.courseTemplates ? p(a.courseTemplates, 'Kursvorlage', 'Kursvorlagen') : '',
  ].filter(Boolean)
  return parts.length ? `${parts.join(', ')} kommen neu dazu.` : 'Es gibt nichts Neues - alles ist schon vorhanden.'
}
