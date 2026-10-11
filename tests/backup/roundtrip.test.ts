import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { applyData, clearAllData, collectData, countEntries } from '@/backup/io'
import { buildBackup, parseBackup, type BackupData } from '@/backup/format'
import { summarize } from '@/backup/summary'
import { db } from '@/modules/handicap/db'
import { useResults } from '@/modules/handicap/composables/useResults'
import { useAchievementsStore } from '@/stores/achievements'
import { useCollectionsStore } from '@/stores/collections'
import { useFavoritesStore } from '@/stores/favorites'
import { useFocusStore } from '@/stores/focus'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'

async function seed() {
  // like in the app, the stores are loaded before anything is written to them
  const settings = useSettingsStore()
  await Promise.all([
    settings.load(), useFavoritesStore().load(), useSessionsStore().load(), useHcpHistoryStore().load(),
    useCollectionsStore().load(), useFocusStore().load(), useAchievementsStore().load(),
  ])
  await settings.update({ hcp: 24.5, targetHcp: 12, targetDate: '2027-06-01', name: 'Bri', theme: 'dark', sounds: false, shuffleFavorites: true, handedness: 'left' })
  await useFavoritesStore().setAll(['putting_circle', 'driving_nine_drives'])
  const focus = useFocusStore().start({ label: 'Tempo', collectionId: undefined, to: '2027-01-01' })!
  useCollectionsStore().add({ name: 'Vor der Runde', drillIds: ['putting_circle', 'chipping_9m_chip'], icon: 'flag' })
  const sessions = useSessionsStore()
  await sessions.addSession({ drillId: 'putting_circle', date: '2026-08-01T10:00:00.000Z', hcp: 25, result: { value: 6, unit: 'Treffer' }, levelReached: 2, notes: 'Gutes Tempo', timerUsed: 300, focusId: focus.id })
  await sessions.addSession({ drillId: 'chipping_9m_chip', date: '2026-09-01T10:00:00.000Z', hcp: null, result: { value: 14, unit: 'Punkte' }, attempts: 3 })
  await useHcpHistoryStore().replaceAll([{ id: 'h1', hcp: 26, valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-06-01T00:00:00.000Z' }, { id: 'h2', hcp: 24.5, valid_from: '2026-06-01T00:00:00.000Z', valid_to: null }])
  await useAchievementsStore().replaceAll([{ id: 'a1', kind: 'badge', title: 'Circle 2★', drillId: 'putting_circle', sessionId: null, level: 2, criteriaVersion: '1', hcp_at_award: 25, awardedAt: '2026-08-02T10:00:00.000Z', metadata: {} }])
  const results = useResults()
  await results.addMany([
    { date: '2026-05-01', courseName: 'GC Nord', grossScore: 95, scoreDifferential: 22.1, storedHandicap: 0, courseRating: 71.2, slope: 128, tee: 'gelb', holes: 18, par: 72 },
    { date: '2026-06-01', courseName: 'GC Süd', grossScore: 91, scoreDifferential: 18.4, storedHandicap: 0, courseRating: 70.0, slope: 124, importKey: '2026-06-01|GC Süd' },
    { date: '2026-07-01', courseName: 'GC Nord', grossScore: 89, scoreDifferential: 16.2, storedHandicap: 0 },
  ])
  await db.courseTemplates.add({ name: 'GC Nord', tee: 'gelb', holes: 18, courseRating: 71.2, slope: 128, par: 72 })
}

async function wipeAll() {
  await db.results.clear()
  await db.courseTemplates.clear()
  // the handicap module keeps its rounds in a module-wide ref: refresh it, or the next test starts with stale rounds
  await useResults().load()
}

beforeEach(async () => { await wipeAll() })

describe('backup roundtrip', () => {
  it('export -> delete everything -> import (replace) restores the identical state', async () => {
    await seed()
    const before = await collectData()
    expect(summarize(before)).toMatchObject({ sessions: 2, rounds: 3, collections: 1, focus: 1, favorites: 2, courseTemplates: 1, achievements: 1, hcpHistory: expect.any(Number) })

    // through a real file: text out, text in
    const file = JSON.stringify(buildBackup(before))
    await clearAllData()

    const emptied = await collectData()
    expect(summarize(emptied)).toMatchObject({ sessions: 0, rounds: 0, collections: 0, focus: 0, favorites: 0, courseTemplates: 0, achievements: 0 })
    expect(emptied.settings?.hcp).toBeNull()
    expect(await countEntries()).toBe(0)

    const parsed = parseBackup(file)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    await applyData('replace', parsed.backup.data)

    const after = await collectData()
    expect(after).toEqual(before)
    // spot checks on things that are easy to lose
    expect(after.sessions.find(s => s.notes === 'Gutes Tempo')).toMatchObject({ timerUsed: 300, focusId: before.focus[0].id, levelReached: 2 })
    expect(after.settings).toMatchObject({ hcp: 24.5, targetHcp: 12, targetDate: '2027-06-01', handedness: 'left', theme: 'dark', sounds: false })
    expect(after.rounds.map(r => r.courseName)).toEqual(['GC Nord', 'GC Süd', 'GC Nord'])
    expect(after.rounds[0]).toMatchObject({ courseRating: 71.2, slope: 128, tee: 'gelb', holes: 18, par: 72 })
  })

  it('"Ersetzen" removes what is not in the backup', async () => {
    await seed()
    const small: BackupData = { ...(await collectData()), sessions: [], rounds: [], collections: [], favorites: [] }
    await applyData('replace', small)
    const after = await collectData()
    expect(after.sessions).toEqual([])
    expect(after.rounds).toEqual([])
    expect(after.collections).toEqual([])
    expect(after.favorites).toEqual([])
    expect(after.focus).toHaveLength(1)
  })

  it('"Zusammenführen" keeps the device data, adds the new entries and is repeatable', async () => {
    await seed()
    const device = await collectData()
    const incoming: BackupData = {
      ...device,
      settings: device.settings,
      sessions: [...device.sessions, { id: 'neu-1', drillId: 'putting_circle', date: '2026-09-15T10:00:00.000Z', hcp: 24, result: { value: 8, unit: 'Treffer' } }],
      rounds: [...device.rounds, { date: '2026-09-01', courseName: 'GC West', grossScore: 88, scoreDifferential: 14.9, storedHandicap: 0 }],
      favorites: [...device.favorites, 'tempo_find_your_tempo'],
      courseTemplates: [...device.courseTemplates, { name: 'GC West', tee: 'rot', holes: 18, courseRating: 68, slope: 120 }],
    }
    const out = await applyData('merge', incoming)
    expect(out.added).toMatchObject({ sessions: 1, rounds: 1, favorites: 1, courseTemplates: 1, collections: 0 })
    const after = await collectData()
    expect(after.sessions).toHaveLength(3)
    expect(after.rounds).toHaveLength(4)
    expect(after.courseTemplates).toHaveLength(2)
    expect(after.favorites).toEqual([...device.favorites, 'tempo_find_your_tempo'])
    expect(after.collections).toEqual(device.collections)
    expect(after.settings).toEqual(device.settings)

    const again = await applyData('merge', incoming)
    expect(Object.values(again.added!).every(n => n === 0)).toBe(true)
    expect(await collectData()).toEqual(after)
  })

  it('imports a backup from an older version (flat format, no rounds) without touching the rounds in "Zusammenführen"', async () => {
    await seed()
    const legacy = parseBackup({ version: 1, settings: { hcp: 30 }, favorites: ['x'], sessions: [] })
    expect(legacy.ok).toBe(true)
    if (!legacy.ok) return
    await applyData('merge', legacy.backup.data)
    const after = await collectData()
    expect(after.rounds).toHaveLength(3)
    expect(after.favorites).toContain('x')
    expect(after.settings?.hcp).toBe(24.5) // the device value wins
  })

  it('recalculates the handicap of imported rounds', async () => {
    await seed()
    const data = await collectData()
    const tampered: BackupData = { ...data, rounds: data.rounds.map(r => ({ ...r, storedHandicap: 99 })) }
    await applyData('replace', tampered)
    const after = await collectData()
    expect(after.rounds.every(r => r.storedHandicap !== 99)).toBe(true)
    expect(after.rounds).toEqual(data.rounds)
  })

  it('clearAllData also resets the reminder bookkeeping and the onboarding', async () => {
    await seed()
    const settings = useSettingsStore()
    await settings.update({ lastBackupAt: '2026-10-01T00:00:00.000Z', lastBackupCount: 7, onboardingDone: true })
    await clearAllData()
    expect(settings.lastBackupAt).toBeNull()
    expect(settings.lastBackupCount).toBe(0)
    expect(settings.onboardingDone).toBe(false)
  })
})
