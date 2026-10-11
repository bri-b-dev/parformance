import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises as microtasks, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataPanel from '@/components/DataPanel.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BackupReminder from '@/components/BackupReminder.vue'
import Toasts from '@/components/Toasts.vue'
import { buildBackup } from '@/backup/format'
import { collectData } from '@/backup/io'
import { db } from '@/modules/handicap/db'
import { useResults } from '@/modules/handicap/composables/useResults'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useFavoritesStore } from '@/stores/favorites'
import { useCollectionsStore } from '@/stores/collections'
import { useRoundsStore } from '@/stores/rounds'

// IndexedDB (fake-indexeddb) answers on macrotasks: wait for those as well as for promises
async function flushPromises() {
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 15))
    await microtasks()
  }
}

const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)
const mounted: Array<{ unmount: () => void }> = []
const track = <T extends { unmount: () => void }>(w: T): T => { mounted.push(w); return w }

let downloads: { name: string; blob: Blob }[] = []

beforeEach(async () => {
  downloads = []
  let lastBlob: Blob | null = null
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: (b: Blob) => { lastBlob = b; return 'blob:test' }, revokeObjectURL: () => {} }))
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push({ name: this.download, blob: lastBlob! }) })
  await db.results.clear()
  await db.courseTemplates.clear()
  await useResults().load()
})

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const readBlob = (b: Blob) => new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsText(b) })

async function setup(seed: boolean) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore()
  await Promise.all([settings.load(), useSessionsStore().load(), useFavoritesStore().load(), useCollectionsStore().load()])
  if (seed) {
    for (let i = 0; i < 3; i++) await useSessionsStore().addSession({ drillId: 'putting_circle', date: new Date(2026, 5, 1 + i).toISOString(), hcp: 24, result: { value: 5 + i, unit: 'x' } })
    useCollectionsStore().add({ name: 'Eigene', drillIds: ['putting_circle'] })
    await useFavoritesStore().setAll(['putting_circle'])
    await useResults().addMany([{ date: '2026-05-01', courseName: 'GC', grossScore: 90, scoreDifferential: 14, storedHandicap: 0 }])
  }
  const confirm = track(mount(ConfirmModal, { attachTo: document.body, global: { plugins: [pinia] } }))
  const toasts = track(mount(Toasts, { attachTo: document.body }))
  const w = track(mount(DataPanel, { attachTo: document.body, global: { plugins: [pinia] } }))
  await flushPromises()
  return { w, pinia, confirm, toasts, settings }
}

function fileInput(w: ReturnType<typeof mount>, content: string) {
  const input = q(w, 'import-file').element as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [{ text: async () => content }], configurable: true })
  return q(w, 'import-file').trigger('change')
}

describe('data panel', () => {
  it('says the data only lives on this device, shows what is stored and that no backup exists yet', async () => {
    const { w } = await setup(true)
    expect(q(w, 'local-note').text()).toContain('nur auf diesem Gerät')
    expect(q(w, 'data-summary').text()).toBe('Gespeichert: 3 Sessions, 1 Runde, 1 Sammlung, 1 Favorit - über 1 Monat')
    expect(q(w, 'last-backup').text()).toBe('Noch kein Backup gespeichert.')
  })

  it('exports a file with all data and records when and how big the backup was', async () => {
    const { w, settings } = await setup(true)
    await q(w, 'export-backup').trigger('click')
    await vi.waitFor(() => expect(downloads).toHaveLength(1), { timeout: 3000 })
    await vi.waitFor(() => expect(settings.lastBackupAt).toBeTruthy(), { timeout: 3000 })
    expect(downloads[0].name).toMatch(/^parformance-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const file = JSON.parse(await readBlob(downloads[0].blob))
    expect(file).toMatchObject({ app: 'parformance', version: 2 })
    expect(file.data.sessions).toHaveLength(3)
    expect(file.data.rounds).toHaveLength(1)
    expect(file.data.collections).toHaveLength(1)
    expect(settings.lastBackupAt).toBeTruthy()
    expect(settings.lastBackupCount).toBe(4)
    expect(q(w, 'last-backup').text()).toContain('heute')
  })

  it('refuses unusable files with a plain message and changes nothing', async () => {
    const { w } = await setup(true)
    await fileInput(w, '{kaputt')
    await vi.waitFor(() => expect(q(w, 'import-error').text()).toContain('beschädigt'), { timeout: 3000 })
    await fileInput(w, JSON.stringify({ hello: 'world' }))
    await vi.waitFor(() => expect(q(w, 'import-error').text()).toContain('keine ParFormance-Sicherung'), { timeout: 3000 })
    await fileInput(w, JSON.stringify({ app: 'parformance', version: 9, data: {} }))
    await vi.waitFor(() => expect(q(w, 'import-error').text()).toContain('neueren App-Version'), { timeout: 3000 })
    expect(q(w, 'import-confirm').exists()).toBe(false)
    expect(useSessionsStore().sessions).toHaveLength(3)
  })

  it('previews the file and merges by default: device data stays, the new entries come in', async () => {
    const { w, toasts } = await setup(true)
    const device = await collectData()
    const incoming = { ...device, sessions: [...device.sessions, { id: 'x1', drillId: 'putting_circle', date: '2026-07-01T10:00:00.000Z', hcp: 24, result: { value: 9, unit: 'x' } }], favorites: ['putting_circle', 'tempo_find_your_tempo'] }
    await fileInput(w, JSON.stringify(buildBackup(incoming)))
    await flushPromises()
    expect(q(w, 'import-summary').text()).toContain('4 Sessions')
    expect(q(w, 'import-meta').text()).toContain('Gesichert am')
    expect((q(w, 'mode-merge').element as HTMLInputElement).checked).toBe(true)
    expect(q(w, 'import-added').text()).toBe('1 Session, 1 Favorit kommen neu dazu.')
    await q(w, 'import-confirm').trigger('click')
    await flushPromises()
    expect(useSessionsStore().sessions).toHaveLength(4)
    expect(useFavoritesStore().favorites).toEqual(['putting_circle', 'tempo_find_your_tempo'])
    expect(useCollectionsStore().items).toHaveLength(1)
    expect(toasts.text()).toContain('Backup eingespielt. 1 Session, 1 Favorit kommen neu dazu.')
    expect(q(w, 'import-confirm').exists()).toBe(false)
    expect(q(w, 'data-summary').text()).toContain('4 Sessions')
  })

  it('"Ersetzen" shows what is lost, asks again, exports the current data first and then replaces', async () => {
    const { w, confirm } = await setup(true)
    const smaller = { ...(await collectData()), sessions: [], rounds: [], collections: [], favorites: ['x'] }
    await fileInput(w, JSON.stringify(buildBackup(smaller)))
    await flushPromises()
    await q(w, 'mode-replace').setValue(true)
    expect(q(w, 'import-lose').text()).toContain('3 Sessions, 1 Runde')
    expect((q(w, 'import-backup-first').element as HTMLInputElement).checked).toBe(true)
    expect(q(w, 'import-confirm').text()).toBe('Ersetzen')

    await q(w, 'import-confirm').trigger('click')
    await flushPromises()
    expect(confirm.find('[data-testid="confirm-message"]').text()).toContain('ersetzen')
    expect(confirm.find('[data-testid="confirm-details"]').text()).toContain('3 Sessions')
    expect(useSessionsStore().sessions).toHaveLength(3) // nothing yet
    await confirm.find('[data-testid="confirm-ok"]').trigger('click')
    await flushPromises()
    expect(downloads).toHaveLength(1) // the safety backup
    expect(useSessionsStore().sessions).toHaveLength(0)
    expect(useFavoritesStore().favorites).toEqual(['x'])
    expect((await collectData()).rounds).toHaveLength(0)
  })

  it('does not replace when the confirmation is declined', async () => {
    const { w, confirm } = await setup(true)
    await fileInput(w, JSON.stringify(buildBackup({ ...(await collectData()), sessions: [] })))
    await flushPromises()
    await q(w, 'mode-replace').setValue(true)
    await q(w, 'import-confirm').trigger('click')
    await flushPromises()
    await confirm.find('[data-testid="confirm-cancel"]').trigger('click')
    await flushPromises()
    expect(useSessionsStore().sessions).toHaveLength(3)
    expect(downloads).toHaveLength(0)
  })

  it('warns about an empty backup and about skipped entries', async () => {
    const { w } = await setup(false)
    await fileInput(w, JSON.stringify({ app: 'parformance', version: 2, data: { sessions: [{ bad: 1 }], favorites: [] } }))
    await flushPromises()
    expect(q(w, 'import-warnings').text()).toContain('1 ungültige Sessions übersprungen')
    expect(q(w, 'import-empty').text()).toContain('keine Daten')
    expect((q(w, 'import-confirm').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('marks a version 1 file as an older backup', async () => {
    const { w } = await setup(false)
    await fileInput(w, JSON.stringify({ version: 1, exportedAt: '2026-03-01T00:00:00.000Z', favorites: ['a'], sessions: [] }))
    await flushPromises()
    expect(q(w, 'import-meta').text()).toContain('Ältere Sicherung')
  })
})

describe('delete everything', () => {
  it('needs the word LÖSCHEN, offers a backup first and then clears all stores and the rounds', async () => {
    const { w, confirm, settings } = await setup(true)
    await q(w, 'reset-all').trigger('click')
    await flushPromises()
    const ok = () => confirm.find('[data-testid="confirm-ok"]')
    expect(confirm.find('#confirm-title').text()).toBe('Alles löschen?')
    expect(confirm.find('[data-testid="confirm-details"]').text()).toContain('3 Sessions')
    expect(ok().classes()).toContain('btn-danger')
    expect((ok().element as HTMLButtonElement).disabled).toBe(true)
    expect(document.activeElement).toBe(confirm.find('#confirm-phrase').element)

    await confirm.find('[data-testid="confirm-phrase"]').setValue('loeschen')
    expect((ok().element as HTMLButtonElement).disabled).toBe(true)
    await confirm.find('[data-testid="confirm-secondary"]').trigger('click')
    await flushPromises()
    expect(downloads).toHaveLength(1)
    expect(confirm.find('[data-testid="confirm-secondary"]').text()).toBe('Backup gespeichert')
    expect((confirm.find('[data-testid="confirm-secondary"]').element as HTMLButtonElement).disabled).toBe(true)

    await confirm.find('[data-testid="confirm-phrase"]').setValue('  löschen ')
    expect((ok().element as HTMLButtonElement).disabled).toBe(false)
    await ok().trigger('click')
    await flushPromises()
    expect(useSessionsStore().sessions).toEqual([])
    expect(useCollectionsStore().items).toEqual([])
    expect(useFavoritesStore().favorites).toEqual([])
    expect(await db.results.count()).toBe(0)
    expect(settings.lastBackupAt).toBeNull()
    expect(q(w, 'data-summary').text()).toBe('Gespeichert: Keine Daten')
    expect(w.emitted('changed')).toHaveLength(1)
  })

  it('does nothing when cancelled or when the word is missing', async () => {
    const { w, confirm } = await setup(true)
    await q(w, 'reset-all').trigger('click')
    await flushPromises()
    await confirm.find('[data-testid="confirm-cancel"]').trigger('click')
    await flushPromises()
    expect(useSessionsStore().sessions).toHaveLength(3)
    expect(w.emitted('changed')).toBeUndefined()
  })

  it('confirms with Enter once the word is typed, and ignores Enter before', async () => {
    const { w, confirm } = await setup(true)
    await q(w, 'reset-all').trigger('click')
    await flushPromises()
    await confirm.find('[data-testid="confirm-phrase"]').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(useSessionsStore().sessions).toHaveLength(3)
    await confirm.find('[data-testid="confirm-phrase"]').setValue('LÖSCHEN')
    await confirm.find('[data-testid="confirm-phrase"]').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(useSessionsStore().sessions).toHaveLength(0)
  })
})

describe('plain confirmations', () => {
  it('still work as before: OK enabled right away, cancel focused', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const confirm = track(mount(ConfirmModal, { attachTo: document.body, global: { plugins: [pinia] } }))
    const { requestConfirm } = await import('@/utils/confirmService')
    const p = requestConfirm('Session löschen?')
    await flushPromises()
    expect(confirm.find('#confirm-title').classes()).toContain('sr-only')
    expect(confirm.find('#confirm-phrase').exists()).toBe(false)
    expect((confirm.find('[data-testid="confirm-ok"]').element as HTMLButtonElement).disabled).toBe(false)
    expect(confirm.find('[data-testid="confirm-ok"]').text()).toBe('OK')
    expect(document.activeElement).toBe(confirm.find('[data-testid="confirm-cancel"]').element)
    await confirm.find('[data-testid="confirm-ok"]').trigger('click')
    expect(await p).toBe(true)
  })
})

describe('backup reminder', () => {
  async function reminder(opts: { sessions: number; lastBackupAt?: string | null; lastBackupCount?: number; snoozedUntil?: string | null }) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    await settings.update({ lastBackupAt: opts.lastBackupAt ?? null, lastBackupCount: opts.lastBackupCount ?? 0, backupSnoozedUntil: opts.snoozedUntil ?? null })
    const sessions = useSessionsStore()
    await sessions.load()
    for (let i = 0; i < opts.sessions; i++) await sessions.addSession({ drillId: 'putting_circle', date: new Date(2026, 0, 1 + i).toISOString(), hcp: null, result: { value: 1, unit: 'x' } })
    useRoundsStore().total = 0
    const w = track(mount(BackupReminder, { attachTo: document.body, global: { plugins: [pinia] } }))
    await flushPromises()
    return { w, settings }
  }

  it('is quiet with little data and speaks up for the first backup at five entries', async () => {
    expect((await reminder({ sessions: 4 })).w.find('[data-testid="backup-reminder"]').exists()).toBe(false)
    const { w } = await reminder({ sessions: 5 })
    expect(q(w, 'backup-reminder-text').text()).toContain('nur auf diesem Gerät')
    expect(q(w, 'backup-reminder-text').text()).toContain('Deine 5 Einträge')
  })

  it('names the number of new entries after the last backup', async () => {
    const { w } = await reminder({ sessions: 25, lastBackupAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), lastBackupCount: 12 })
    expect(q(w, 'backup-reminder-text').text()).toMatch(/gibt es 13 neue Einträge/)
  })

  it('"Jetzt sichern" exports and the reminder goes away', async () => {
    const { w, settings } = await reminder({ sessions: 6 })
    await q(w, 'backup-now').trigger('click')
    await flushPromises()
    expect(downloads).toHaveLength(1)
    expect(settings.lastBackupCount).toBe(6)
    expect(w.find('[data-testid="backup-reminder"]').exists()).toBe(false)
  })

  it('"Später" snoozes it for a week', async () => {
    const { w, settings } = await reminder({ sessions: 6 })
    await q(w, 'backup-later').trigger('click')
    await flushPromises()
    expect(w.find('[data-testid="backup-reminder"]').exists()).toBe(false)
    expect(Date.parse(settings.backupSnoozedUntil!) - Date.now()).toBeGreaterThan(6.9 * 86_400_000)
  })

  it('respects an existing snooze', async () => {
    const { w } = await reminder({ sessions: 30, snoozedUntil: new Date(Date.now() + 86_400_000).toISOString() })
    expect(w.find('[data-testid="backup-reminder"]').exists()).toBe(false)
  })
})
