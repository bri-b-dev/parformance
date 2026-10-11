import { emptyData, sanitizeRound, sanitizeTemplate, type BackupData, type BackupSettings } from '@/backup/format'
import { mergeData, type MergeCounts } from '@/backup/merge'
import { useAchievementsStore } from '@/stores/achievements'
import { useCollectionsStore } from '@/stores/collections'
import { useFavoritesStore } from '@/stores/favorites'
import { useFocusStore } from '@/stores/focus'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useRunStore } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'

export type ImportMode = 'merge' | 'replace'

async function loadStores() {
  const settings = useSettingsStore()
  const favorites = useFavoritesStore()
  const sessions = useSessionsStore()
  const history = useHcpHistoryStore()
  const collections = useCollectionsStore()
  const focus = useFocusStore()
  const achievements = useAchievementsStore()
  await Promise.all([
    settings.loaded ? null : settings.load(),
    favorites.loaded ? null : favorites.load(),
    sessions.loaded ? null : sessions.load(),
    history.loaded ? null : history.load(),
    collections.loaded ? null : collections.load(),
    focus.loaded ? null : focus.load(),
    achievements.loaded ? null : achievements.load(),
  ])
  return { settings, favorites, sessions, history, collections, focus, achievements }
}

/** The handicap area keeps rounds and course templates in IndexedDB; loaded on demand to stay out of the start bundle. */
async function handicapDb() {
  return (await import('@/modules/handicap/db')).db
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

/** Everything the player has created on this device, as one plain object. */
export async function collectData(): Promise<BackupData> {
  const s = await loadStores()
  const db = await handicapDb()
  const [rounds, templates] = await Promise.all([db.results.toArray(), db.courseTemplates.toArray()])
  const settings: BackupSettings = {
    hcp: s.settings.hcp, targetHcp: s.settings.targetHcp, targetDate: s.settings.targetDate, handedness: s.settings.handedness, name: s.settings.name,
    language: s.settings.language, units: s.settings.units, theme: s.settings.theme, sounds: s.settings.sounds,
    shuffleFavorites: s.settings.shuffleFavorites, notifications: s.settings.notifications,
  }
  return {
    settings,
    favorites: clone(s.favorites.favorites),
    sessions: clone(s.sessions.sessions),
    hcpHistory: clone(s.history.rows),
    collections: clone(s.collections.items),
    focus: clone(s.focus.items),
    achievements: clone(s.achievements.items),
    rounds: rounds.map(r => sanitizeRound(r)).filter((r): r is NonNullable<typeof r> => r !== null),
    courseTemplates: templates.map(t => sanitizeTemplate(t)).filter((t): t is NonNullable<typeof t> => t !== null),
  }
}

/** Sessions + rounds: what the backup reminder counts. */
export async function countEntries(): Promise<number> {
  const s = await loadStores()
  const db = await handicapDb()
  return s.sessions.sessions.length + (await db.results.count())
}

/** Write `target` over everything on the device. */
async function writeData(target: BackupData) {
  const s = await loadStores()
  const db = await handicapDb()

  await db.transaction('rw', db.results, db.courseTemplates, async () => {
    await db.results.clear()
    await db.courseTemplates.clear()
    if (target.rounds.length) await db.results.bulkAdd(target.rounds.map(r => ({ ...r })))
    if (target.courseTemplates.length) await db.courseTemplates.bulkAdd(target.courseTemplates.map(t => ({ ...t })))
  })

  if (target.settings) await s.settings.update({ ...target.settings, onboardingDone: true })
  await Promise.all([
    s.favorites.setAll(target.favorites),
    s.sessions.replaceAll(target.sessions),
    s.history.replaceAll(target.hcpHistory),
    s.achievements.replaceAll(target.achievements),
  ])
  s.collections.replaceAll(target.collections)
  s.focus.replaceAll(target.focus)

  // stored handicaps follow from the rounds: bring them (and the open handicap screens) up to date
  const { useResults } = await import('@/modules/handicap/composables/useResults')
  const results = useResults()
  await results.load()
  await results.recalc()
}

export interface ImportOutcome {
  mode: ImportMode
  /** What the device held afterwards. */
  after: BackupData
  /** Only for "merge": how much was new. */
  added: MergeCounts | null
}

/** Apply a cleaned backup: "replace" overwrites everything, "merge" keeps the device's data and adds what is new. */
export async function applyData(mode: ImportMode, incoming: BackupData): Promise<ImportOutcome> {
  if (mode === 'replace') {
    await writeData({ ...incoming, settings: incoming.settings ?? (await collectData()).settings })
    return { mode, after: await collectData(), added: null }
  }
  const { merged, added } = mergeData(await collectData(), incoming)
  await writeData(merged)
  return { mode, after: await collectData(), added }
}

/** Delete everything the player has stored on this device. */
export async function clearAllData(): Promise<void> {
  const s = await loadStores()
  const db = await handicapDb()
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear()
  })
  await Promise.all([
    s.settings.clearAll(),
    s.favorites.clearAll(),
    s.sessions.clearAll(),
    s.history.clearAll(),
    s.achievements.clearAll(),
  ])
  s.collections.clearAll()
  s.focus.clearAll()
  useRunStore().clear()
  const { useResults } = await import('@/modules/handicap/composables/useResults')
  await useResults().load()
}

export { emptyData }
