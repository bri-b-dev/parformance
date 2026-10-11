import { version as APP_VERSION } from '../../package.json'
import { sanitizeAchievement, type AchievementSnapshot } from '@/stores/achievements'
import { sanitizeCollection, type Collection } from '@/stores/collections'
import { sanitizeFocus, type Focus } from '@/stores/focus'
import type { HcpHistoryRow } from '@/stores/hcpHistory'
import { sanitizeSession } from '@/stores/sessions'
import { normalizeDate, normalizeHcp } from '@/stores/settings'
import type { Session } from '@/types'

export const BACKUP_APP = 'parformance'
export const BACKUP_VERSION = 2

export interface BackupSettings {
  hcp: number | null
  targetHcp: number | null
  targetDate: string | null
  handedness: 'right' | 'left'
  name: string
  language: 'de' | 'en'
  units: 'metric' | 'imperial'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  shuffleFavorites: boolean
  notifications: boolean
}

/** A round of the handicap area (without its database id: ids are per device). */
export interface BackupRound {
  date: string
  courseName: string
  grossScore: number
  scoreDifferential: number
  storedHandicap: number
  importKey?: string
  holes?: number
  courseRating?: number
  slope?: number
  pcc?: number
  tee?: string
  par?: number
}

export interface BackupTemplate {
  name: string
  tee: string
  holes: number
  courseRating: number
  slope: number
  par?: number
}

export interface BackupData {
  settings: BackupSettings | null
  favorites: string[]
  sessions: Session[]
  hcpHistory: HcpHistoryRow[]
  collections: Collection[]
  focus: Focus[]
  achievements: AchievementSnapshot[]
  rounds: BackupRound[]
  courseTemplates: BackupTemplate[]
}

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  appVersion: string
  data: BackupData
}

export const emptyData = (): BackupData => ({
  settings: null, favorites: [], sessions: [], hcpHistory: [], collections: [], focus: [], achievements: [], rounds: [], courseTemplates: [],
})

export function buildBackup(data: BackupData, now: Date = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), appVersion: APP_VERSION, data }
}

export type ParseError = 'invalid-json' | 'not-backup' | 'too-new'

export type ParseResult =
  | { ok: true; backup: Backup; /** file from before the versioned format (version 1) */ legacy: boolean; warnings: string[] }
  | { ok: false; error: ParseError; message: string }

export type ParseFailure = Extract<ParseResult, { ok: false }>
export type ParseSuccess = Extract<ParseResult, { ok: true }>

/** Type guard that also narrows without strict null checks. */
export const isParseFailure = (r: ParseResult): r is ParseFailure => !r.ok

const fail = (error: ParseError, message: string): ParseResult => ({ ok: false, error, message })

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v.slice(0, 10)))
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

export function sanitizeSettings(raw: unknown): BackupSettings | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  return {
    hcp: normalizeHcp(s.hcp),
    targetHcp: normalizeHcp(s.targetHcp),
    targetDate: normalizeDate(s.targetDate),
    handedness: s.handedness === 'left' ? 'left' : 'right',
    name: typeof s.name === 'string' ? s.name.slice(0, 80) : '',
    language: s.language === 'en' ? 'en' : 'de',
    units: s.units === 'imperial' ? 'imperial' : 'metric',
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
    sounds: typeof s.sounds === 'boolean' ? s.sounds : true,
    shuffleFavorites: typeof s.shuffleFavorites === 'boolean' ? s.shuffleFavorites : false,
    notifications: typeof s.notifications === 'boolean' ? s.notifications : false,
  }
}

export function sanitizeRound(raw: unknown): BackupRound | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const gross = num(r.grossScore)
  const diff = num(r.scoreDifferential)
  if (!isDay(r.date) || gross === undefined || diff === undefined) return null
  const out: BackupRound = {
    date: r.date,
    courseName: str(r.courseName) ?? '',
    grossScore: gross,
    scoreDifferential: diff,
    storedHandicap: num(r.storedHandicap) ?? 0,
  }
  if (str(r.importKey)) out.importKey = str(r.importKey)
  for (const k of ['holes', 'courseRating', 'slope', 'pcc', 'par'] as const) {
    const v = num(r[k])
    if (v !== undefined) out[k] = v
  }
  if (str(r.tee)) out.tee = str(r.tee)
  return out
}

export function sanitizeTemplate(raw: unknown): BackupTemplate | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Record<string, unknown>
  const name = str(t.name)?.trim()
  const rating = num(t.courseRating)
  const slope = num(t.slope)
  const holes = num(t.holes)
  if (!name || rating === undefined || slope === undefined || holes === undefined) return null
  const out: BackupTemplate = { name, tee: str(t.tee) ?? '', holes, courseRating: rating, slope }
  if (num(t.par) !== undefined) out.par = num(t.par)
  return out
}

function sanitizeHistoryRow(raw: unknown): HcpHistoryRow | null {
  const r = raw as Partial<HcpHistoryRow> | null
  if (!r || typeof r.hcp !== 'number' || !Number.isFinite(r.hcp)) return null
  if (typeof r.valid_from !== 'string' || Number.isNaN(Date.parse(r.valid_from))) return null
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    hcp: r.hcp,
    valid_from: r.valid_from,
    valid_to: typeof r.valid_to === 'string' && !Number.isNaN(Date.parse(r.valid_to)) ? r.valid_to : null,
  }
}

const SECTION_LABEL: Record<string, string> = {
  sessions: 'Sessions', rounds: 'Runden', collections: 'Sammlungen', focus: 'Fokus-Punkte', achievements: 'Auszeichnungen',
  courseTemplates: 'Kursvorlagen', hcpHistory: 'HCP-Einträge',
}

/** Clean one array section; entries that cannot be used are counted for a warning. */
function section<T>(raw: unknown, clean: (x: unknown) => T | null, key: string, warnings: string[]): T[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    warnings.push(`${SECTION_LABEL[key] ?? key}: unerwartetes Format, übersprungen`)
    return []
  }
  const out = raw.map(clean).filter((x): x is T => x !== null)
  const dropped = raw.length - out.length
  if (dropped > 0) warnings.push(`${dropped} ungültige ${SECTION_LABEL[key] ?? key} übersprungen`)
  return out
}

/**
 * Read a backup file (text or already parsed JSON). Understands the current format (`{ app, version, data }`)
 * and the flat version 1 export. Everything is cleaned; unusable entries become warnings, not failures.
 */
export function parseBackup(input: string | unknown): ParseResult {
  let raw: unknown = input
  if (typeof input === 'string') {
    try { raw = JSON.parse(input) } catch { return fail('invalid-json', 'Die Datei ist beschädigt oder keine JSON-Datei.') }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('not-backup', 'Das ist keine ParFormance-Sicherung.')
  const r = raw as Record<string, unknown>

  if (r.app !== undefined && r.app !== BACKUP_APP) return fail('not-backup', 'Das ist keine ParFormance-Sicherung.')
  const version = typeof r.version === 'number' ? r.version : 1
  if (version > BACKUP_VERSION) return fail('too-new', `Diese Sicherung stammt aus einer neueren App-Version (Format ${version}). Bitte aktualisiere ParFormance.`)

  const legacy = !(r.data && typeof r.data === 'object')
  const src = (legacy ? r : r.data) as Record<string, unknown>
  const known = ['settings', 'favorites', 'sessions', 'hcpHistory', 'collections', 'focus', 'achievements', 'rounds', 'courseTemplates']
  if (!known.some(k => k in src)) return fail('not-backup', 'Das ist keine ParFormance-Sicherung.')

  const warnings: string[] = []
  const favorites = Array.isArray(src.favorites) ? Array.from(new Set(src.favorites.map(f => String(f).trim()).filter(Boolean))) : []
  const data: BackupData = {
    settings: sanitizeSettings(src.settings),
    favorites,
    sessions: section(src.sessions, sanitizeSession, 'sessions', warnings),
    hcpHistory: section(src.hcpHistory, sanitizeHistoryRow, 'hcpHistory', warnings),
    collections: section(src.collections, sanitizeCollection, 'collections', warnings),
    focus: section(src.focus, sanitizeFocus, 'focus', warnings),
    achievements: section(src.achievements, sanitizeAchievement, 'achievements', warnings),
    rounds: section(src.rounds, sanitizeRound, 'rounds', warnings),
    courseTemplates: section(src.courseTemplates, sanitizeTemplate, 'courseTemplates', warnings),
  }
  const exportedAt = typeof r.exportedAt === 'string' && !Number.isNaN(Date.parse(r.exportedAt)) ? r.exportedAt : new Date(0).toISOString()
  return {
    ok: true,
    legacy,
    warnings,
    backup: { app: BACKUP_APP, version: legacy ? 1 : version, exportedAt, appVersion: typeof r.appVersion === 'string' ? r.appVersion : '', data },
  }
}
