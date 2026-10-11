import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, buildBackup, emptyData, parseBackup, sanitizeRound, sanitizeSettings, sanitizeTemplate } from '@/backup/format'
import { describeSummary, isEmptyData, summarize } from '@/backup/summary'
import { describeAdded, mergeData } from '@/backup/merge'
import { backupReminder, snoozeUntil } from '@/backup/reminder'
import type { BackupData } from '@/backup/format'
import type { Session } from '@/types'

const sess = (id: string, date: string, extra: Partial<Session> = {}): Session => ({ id, drillId: 'd1', date, hcp: 20, result: { value: 5, unit: 'x' }, ...extra })
const data = (over: Partial<BackupData> = {}): BackupData => ({ ...emptyData(), ...over })

describe('buildBackup / parseBackup', () => {
  it('writes a versioned envelope and reads it back unchanged', () => {
    const d = data({ sessions: [sess('a', '2026-01-02T10:00:00.000Z', { notes: 'Gut', focusId: 'f1' })], favorites: ['x', 'y'] })
    const b = buildBackup(d, new Date('2026-10-11T08:00:00.000Z'))
    expect(b).toMatchObject({ app: 'parformance', version: BACKUP_VERSION, exportedAt: '2026-10-11T08:00:00.000Z' })
    expect(b.appVersion).toMatch(/^\d+\.\d+\.\d+/)
    const p = parseBackup(JSON.stringify(b))
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.legacy).toBe(false)
    expect(p.warnings).toEqual([])
    expect(p.backup.data.sessions[0]).toMatchObject({ id: 'a', notes: 'Gut', focusId: 'f1' })
    expect(p.backup.data.favorites).toEqual(['x', 'y'])
  })

  it('understands the flat version 1 export', () => {
    const p = parseBackup({ version: 1, exportedAt: '2026-03-01T00:00:00.000Z', settings: { hcp: 18 }, favorites: ['a'], sessions: [sess('a', '2026-01-02T10:00:00.000Z')] })
    expect(p.ok && p.legacy).toBe(true)
    if (p.ok) {
      expect(p.backup.data.settings?.hcp).toBe(18)
      expect(p.backup.data.sessions).toHaveLength(1)
      expect(p.backup.data.rounds).toEqual([])
    }
  })

  it('rejects broken, foreign and too-new files with a plain message', () => {
    expect(parseBackup('{kaputt')).toMatchObject({ ok: false, error: 'invalid-json' })
    expect(parseBackup('[1,2]')).toMatchObject({ ok: false, error: 'not-backup' })
    expect(parseBackup('"text"')).toMatchObject({ ok: false, error: 'not-backup' })
    expect(parseBackup({ app: 'other', version: 1, data: {} })).toMatchObject({ ok: false, error: 'not-backup' })
    expect(parseBackup({ foo: 1 })).toMatchObject({ ok: false, error: 'not-backup' })
    const newer = parseBackup({ app: 'parformance', version: 99, data: { sessions: [] } })
    expect(newer).toMatchObject({ ok: false, error: 'too-new' })
    expect((newer as { message: string }).message).toContain('neueren App-Version')
  })

  it('drops unusable entries with a warning instead of failing', () => {
    const p = parseBackup({
      app: 'parformance', version: 2,
      data: {
        sessions: [sess('ok', '2026-01-02T10:00:00.000Z'), { drillId: '', date: 'x' }, null, 'x'],
        rounds: [{ date: '2026-02-01', courseName: 'GC', grossScore: 90, scoreDifferential: 12.3, storedHandicap: 15 }, { date: 'bad' }],
        collections: [{ name: '' }],
        focus: 'nope',
      },
    })
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.backup.data.sessions).toHaveLength(1)
    expect(p.backup.data.rounds).toHaveLength(1)
    expect(p.warnings).toEqual(expect.arrayContaining(['3 ungültige Sessions übersprungen', '1 ungültige Runden übersprungen', '1 ungültige Sammlungen übersprungen', 'Fokus-Punkte: unerwartetes Format, übersprungen']))
  })

  it('cleans settings and rounds from untrusted values', () => {
    expect(sanitizeSettings({ hcp: 99, targetHcp: 12, targetDate: 'morgen', theme: 'neon', language: 'fr', name: 'x'.repeat(200) })).toMatchObject({
      hcp: null, targetHcp: 12, targetDate: null, theme: 'system', language: 'de',
    })
    expect(sanitizeSettings(null)).toBeNull()
    expect(sanitizeRound({ date: '2026-02-01', grossScore: '90', scoreDifferential: 1 })).toBeNull()
    expect(sanitizeRound({ date: '2026-02-01', courseName: 'GC', grossScore: 90, scoreDifferential: 1, storedHandicap: 2, holes: 9, slope: 120, tee: 'gelb', id: 7, evil: 1 })).toEqual({
      date: '2026-02-01', courseName: 'GC', grossScore: 90, scoreDifferential: 1, storedHandicap: 2, holes: 9, slope: 120, tee: 'gelb',
    })
    expect(sanitizeTemplate({ name: ' Platz ', tee: 'rot', holes: 18, courseRating: 70, slope: 125, par: 72 })).toMatchObject({ name: 'Platz', par: 72 })
    expect(sanitizeTemplate({ name: '', holes: 18, courseRating: 70, slope: 125 })).toBeNull()
  })
})

describe('summary', () => {
  it('counts and describes what is in a backup', () => {
    const d = data({
      sessions: [sess('a', '2025-02-01T10:00:00.000Z'), sess('b', '2026-04-01T10:00:00.000Z')],
      rounds: [{ date: '2025-01-10', courseName: 'GC', grossScore: 90, scoreDifferential: 10, storedHandicap: 12 }],
      collections: [{ id: 'c', name: 'N', drillIds: [], createdAt: '2026-01-01T00:00:00.000Z' }],
      favorites: ['x'],
    })
    const s = summarize(d)
    expect(s).toMatchObject({ sessions: 2, rounds: 1, collections: 1, favorites: 1, firstDate: '2025-01-10', lastDate: '2026-04-01' })
    expect(s.months).toBe(15)
    expect(describeSummary(s)).toBe('2 Sessions, 1 Runde, 1 Sammlung, 1 Favorit - über 15 Monate')
    expect(isEmptyData(s)).toBe(false)
  })

  it('handles an empty state and singular forms', () => {
    const empty = summarize(data())
    expect(describeSummary(empty)).toBe('Keine Daten')
    expect(isEmptyData(empty)).toBe(true)
    expect(describeSummary(summarize(data({ sessions: [sess('a', '2026-01-01T00:00:00.000Z')] })))).toBe('1 Session - über 1 Monat')
  })
})

describe('mergeData', () => {
  const base = data({
    settings: { ...sanitizeSettings({ hcp: null, name: '' })!, theme: 'dark' },
    favorites: ['a'],
    sessions: [sess('s1', '2026-01-01T10:00:00.000Z', { notes: 'mein Gerät' })],
    rounds: [{ date: '2026-02-01', courseName: 'GC', grossScore: 90, scoreDifferential: 10, storedHandicap: 12 }],
    courseTemplates: [{ name: 'GC', tee: 'gelb', holes: 18, courseRating: 70, slope: 125 }],
    collections: [{ id: 'c1', name: 'Eigene', drillIds: ['x'], createdAt: '2026-01-01T00:00:00.000Z' }],
  })
  const other = data({
    settings: { ...sanitizeSettings({ hcp: 18, name: 'Bri', theme: 'light' })! },
    favorites: ['a', 'b'],
    sessions: [sess('s1', '2026-01-01T10:00:00.000Z', { notes: 'anderes Gerät' }), sess('s2', '2026-01-05T10:00:00.000Z')],
    rounds: [
      { date: '2026-02-01', courseName: 'GC', grossScore: 90, scoreDifferential: 10, storedHandicap: 99 }, // same round
      { date: '2026-03-01', courseName: 'GC', grossScore: 85, scoreDifferential: 8, storedHandicap: 11 },
    ],
    courseTemplates: [{ name: 'GC', tee: 'gelb', holes: 18, courseRating: 70, slope: 125 }, { name: 'Neu', tee: 'rot', holes: 9, courseRating: 33, slope: 118 }],
    collections: [{ id: 'c1', name: 'Fremd', drillIds: [], createdAt: '2026-02-01T00:00:00.000Z' }, { id: 'c2', name: 'Weitere', drillIds: [], createdAt: '2026-02-01T00:00:00.000Z' }],
  })

  it('keeps what is on the device and adds only what is new', () => {
    const { merged, added } = mergeData(base, other)
    expect(merged.sessions.map(s => s.id)).toEqual(['s1', 's2'])
    expect(merged.sessions[0].notes).toBe('mein Gerät') // existing wins
    expect(merged.rounds).toHaveLength(2)
    expect(merged.rounds[0].storedHandicap).toBe(12)
    expect(merged.courseTemplates.map(t => t.name)).toEqual(['GC', 'Neu'])
    expect(merged.collections.map(c => c.name)).toEqual(['Eigene', 'Weitere'])
    expect(merged.favorites).toEqual(['a', 'b'])
    expect(added).toMatchObject({ sessions: 1, rounds: 1, courseTemplates: 1, collections: 1, favorites: 1 })
  })

  it('keeps the device settings and fills only the gaps from the backup', () => {
    const { merged } = mergeData(base, other)
    expect(merged.settings).toMatchObject({ theme: 'dark', hcp: 18, name: 'Bri' })
  })

  it('is idempotent: merging the same backup twice adds nothing', () => {
    const once = mergeData(base, other).merged
    const twice = mergeData(once, other)
    expect(twice.merged).toEqual(once)
    expect(Object.values(twice.added).every(n => n === 0)).toBe(true)
    expect(describeAdded(twice.added)).toBe('Es gibt nichts Neues - alles ist schon vorhanden.')
  })

  it('describes the news', () => {
    expect(describeAdded(mergeData(base, other).added)).toBe('1 Session, 1 Runde, 1 Sammlung, 1 Favorit, 1 Kursvorlage kommen neu dazu.')
  })
})

describe('backupReminder', () => {
  const now = new Date('2026-10-11T12:00:00.000Z')
  const base = { now, lastBackupAt: null as string | null, lastBackupCount: 0, currentCount: 0, snoozedUntil: null as string | null }
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()

  it('asks for the first backup once there is something worth keeping', () => {
    expect(backupReminder({ ...base, currentCount: 4 }).due).toBe(false)
    expect(backupReminder({ ...base, currentCount: 5 })).toMatchObject({ due: true, reason: 'never', newItems: 5 })
  })

  it('reminds after 10 new entries or after 30 days with changes', () => {
    expect(backupReminder({ ...base, lastBackupAt: ago(3), lastBackupCount: 20, currentCount: 29 }).due).toBe(false)
    expect(backupReminder({ ...base, lastBackupAt: ago(3), lastBackupCount: 20, currentCount: 30 })).toMatchObject({ due: true, reason: 'many', newItems: 10 })
    expect(backupReminder({ ...base, lastBackupAt: ago(31), lastBackupCount: 20, currentCount: 21 })).toMatchObject({ due: true, reason: 'old' })
    expect(backupReminder({ ...base, lastBackupAt: ago(31), lastBackupCount: 20, currentCount: 20 }).due).toBe(false) // nothing changed
  })

  it('stays quiet while snoozed and when entries were deleted', () => {
    expect(backupReminder({ ...base, currentCount: 50, snoozedUntil: snoozeUntil(now) }).due).toBe(false)
    expect(backupReminder({ ...base, currentCount: 50, snoozedUntil: ago(1) }).due).toBe(true)
    expect(backupReminder({ ...base, lastBackupAt: ago(2), lastBackupCount: 40, currentCount: 10 }).newItems).toBe(0)
    expect(Date.parse(snoozeUntil(now)) - now.getTime()).toBe(7 * 86_400_000)
  })
})
