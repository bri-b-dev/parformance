import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { buildBackup, type Backup } from '@/backup/format'
import { collectData, countEntries } from '@/backup/io'
import { useSettingsStore } from '@/stores/settings'

function toast(type: 'info' | 'success' | 'error', message: string) {
  try {
    globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }))
  } catch { /* no window */ }
}

export const backupFileName = (now: Date = new Date()) => `parformance-backup-${now.toISOString().slice(0, 10)}.json`

function downloadWeb(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Android/iOS: write to the cache and open the share sheet (no storage permission needed). */
async function shareNative(filename: string, text: string) {
  await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })
  try {
    await Share.share({ title: 'ParFormance-Backup', text: 'ParFormance-Backup', files: [uri], dialogTitle: 'Backup teilen oder speichern' })
  } catch {
    // some targets only take a url
    await Share.share({ title: 'ParFormance-Backup', text: 'ParFormance-Backup', url: Capacitor.convertFileSrc(uri), dialogTitle: 'Backup teilen oder speichern' })
  }
}

export interface ExportResult {
  ok: boolean
  backup?: Backup
}

/**
 * Collect all data, hand it to the user as a file and remember the time and size for the reminder.
 * The bookkeeping is only written after the file was handed over.
 */
export async function exportBackupFile(now: Date = new Date()): Promise<ExportResult> {
  const backup = buildBackup(await collectData(), now)
  const text = JSON.stringify(backup, null, 2)
  const filename = backupFileName(now)
  try {
    if (Capacitor.isNativePlatform()) await shareNative(filename, text)
    else downloadWeb(filename, text)
  } catch (e) {
    console.error('Backup export failed', e)
    try {
      // last resort for the app: a browser style download
      if (Capacitor.isNativePlatform()) downloadWeb(filename, text)
      else throw e
    } catch {
      toast('error', 'Das Backup konnte nicht gespeichert werden. Bitte prüfe die Berechtigungen und versuche es erneut.')
      return { ok: false }
    }
  }
  const settings = useSettingsStore()
  await settings.update({ lastBackupAt: now.toISOString(), lastBackupCount: await countEntries(), backupSnoozedUntil: null })
  toast('success', 'Backup gespeichert.')
  return { ok: true, backup }
}
