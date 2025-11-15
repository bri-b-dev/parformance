<template>
  <transition name="sheet">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>
      <div
        class="absolute right-0 top-0 h-full w-[min(480px,92vw)] settings-sheet-panel shadow-2xl p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold">Einstellungen</h3>
          <button class="btn" type="button" @click="$emit('close')">Schließen</button>
        </div>
        <SettingsForm v-model="formModel" @save="saveAndClose" @cancel="$emit('close')" @export-data="exportData"
          @import-data="importData" @reset="resetAll" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import SettingsForm from '@/components/settings/SettingsForm.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { Session } from '@/types'
import { onMounted, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<(e: 'close') => void>()

type FormModel = {
  name: string
  hcp: number | null
  handedness: 'right' | 'left'
  language: 'de' | 'en'
  units: 'metric' | 'imperial'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  shuffleFavorites: boolean
  notifications: boolean
}

const settingsStore = useSettingsStore()
const favoritesStore = useFavoritesStore()
const sessionsStore = useSessionsStore()

const defaultModel = (): FormModel => ({
  name: settingsStore.name ?? '',
  hcp: typeof settingsStore.hcp === 'number' && Number.isFinite(settingsStore.hcp) ? settingsStore.hcp : null,
  handedness: settingsStore.handedness ?? 'right',
  language: settingsStore.language ?? 'de',
  units: settingsStore.units ?? 'metric',
  theme: settingsStore.theme ?? 'system',
  sounds: settingsStore.sounds ?? true,
  shuffleFavorites: settingsStore.shuffleFavorites ?? false,
  notifications: settingsStore.notifications ?? false,
})

const formModel = ref<FormModel>(defaultModel())

function syncFromStore() {
  formModel.value = defaultModel()
}

async function ensureStoresLoaded() {
  if (!settingsStore.loaded) await settingsStore.load()
  if (!favoritesStore.loaded) await favoritesStore.load()
  if (!sessionsStore.loaded) await sessionsStore.load()
}

onMounted(async () => {
  await ensureStoresLoaded()
  syncFromStore()
})

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await ensureStoresLoaded()
    syncFromStore()
  }
})

function resolveThemePreference(preference: 'system' | 'light' | 'dark'): 'light' | 'dark' {
  if (preference !== 'system') {
    return preference
  }

  const hasWindow = globalThis.window !== undefined
  const hasMatchMedia = globalThis.matchMedia !== undefined
  const prefersDark = hasWindow && hasMatchMedia &&
    globalThis.matchMedia('(prefers-color-scheme: dark)').matches

  return prefersDark ? 'dark' : 'light'
}

async function saveAndClose(values: FormModel) {
  await ensureStoresLoaded()
  await settingsStore.update({
    name: values.name,
    hcp: typeof values.hcp === 'number' && Number.isFinite(values.hcp) ? values.hcp : null,
    handedness: values.handedness,
    language: values.language,
    units: values.units,
    theme: values.theme,
    sounds: values.sounds,
    shuffleFavorites: values.shuffleFavorites,
    notifications: values.notifications,
  })
  // Ensure theme is applied immediately even if listeners miss the event
  try {
    const resolved = resolveThemePreference(values.theme)
    if (document !== undefined && document.documentElement) {
      document.documentElement.dataset.theme = resolved
    }
    try {
      globalThis.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: values.theme })) } catch { }
  } catch {
    // ignore
  }
  emit('close')
}

// Alter Web-Download als Fallback beibehalten
function downloadJsonWeb(filename: string, data: any) {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Neu: Native Variante für APK
async function downloadJsonNative(filename: string, data: any) {
  const json = JSON.stringify(data, null, 2)

  // In Cache schreiben, keine Extra-Berechtigungen nötig
  try {
    await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })

    // Native URI für die Datei besorgen
    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    })

    // Share-Sheet öffnen. Neuere Share-Versionen können 'files'
    try {
      // Try files first (preferred on Android when supported)
      await Share.share({
        title: 'Datenexport',
        text: 'ParFormance-Exportdatei',
        files: [uri], // bevorzugt, wenn unterstützt
        dialogTitle: 'Export teilen oder speichern',
      })
      showAlert('Export gestartet (native Share)')
      return
    } catch (error_) {
      console.debug('Share.files failed, falling back to url share', error_)
    }

    // Fallback: try URL via convertFileSrc (works for webview preview / some share impls)
    try {
      const url = Capacitor.convertFileSrc(uri)
      console.debug('Export: converted file src to url=', url)
      showAlert('Export: versuche URL-Fallback')
      await Share.share({
        title: 'Datenexport',
        text: 'ParFormance-Exportdatei',
        url,
        dialogTitle: 'Export teilen oder speichern',
      })
      showAlert('Export gestartet (URL-Fallback)')
      return
    } catch (error_) {
      console.error('Share.url fallback failed', error_)
      throw error_
    }
  } catch (err) {
    console.error('downloadJsonNative failed', err)
    showAlert('Export fehlgeschlagen — siehe Logcat (adb) oder chrome://inspect: ' + err.message)
    throw err
  }
}

function showAlert(message: string) {
  try {
    // @ts-ignore
    globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message } }))
  } catch {
    // fallback
    // fallback: log to console instead of blocking alert
    // eslint-disable-next-line no-console
    console.log(message)
  }
}

import { requestConfirm } from '@/utils/confirmService'

function showConfirm(message: string): Promise<boolean> {
  return requestConfirm(message)
}

async function exportData() {
  await ensureStoresLoaded()

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    settings: {
      hcp: settingsStore.hcp,
      handedness: settingsStore.handedness,
      name: settingsStore.name,
      language: settingsStore.language,
      units: settingsStore.units,
      theme: settingsStore.theme,
      sounds: settingsStore.sounds,
      shuffleFavorites: settingsStore.shuffleFavorites,
      notifications: settingsStore.notifications,
    },
    favorites: JSON.parse(JSON.stringify(favoritesStore.favorites ?? [])),
    sessions: JSON.parse(JSON.stringify(sessionsStore.sessions ?? [])),
  }

  const fileName = `parformance-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

  // Web: alter Weg
  if (!Capacitor.isNativePlatform()) {
    downloadJsonWeb(fileName, payload)
    return
  }

  // Native (Android/iOS): Datei schreiben und teilen
  try {
    await downloadJsonNative(fileName, payload)
  } catch (err) {
    // If native export fails, attempt a web fallback so user can still get data
    console.error('Native export failed, trying web fallback', err)
    try {
      downloadJsonWeb(fileName, payload)
      showAlert('Export als Web-Download gestartet (Fallback).')
    } catch (error_) {
      console.error('Web fallback export also failed', error_)
      showAlert('Export fehlgeschlagen. Bitte prüfen Sie die App-Berechtigungen.')
    }
  }
}

async function importData(data: any) {
  try {
    await ensureStoresLoaded()
    if (data?.settings && typeof data.settings === 'object') {
      await settingsStore.update({
        hcp: typeof data.settings.hcp === 'number' ? data.settings.hcp : null,
        handedness: data.settings.handedness,
        name: data.settings.name,
        language: data.settings.language,
        units: data.settings.units,
        theme: data.settings.theme,
        sounds: data.settings.sounds,
        shuffleFavorites: data.settings.shuffleFavorites,
        notifications: data.settings.notifications,
      })
    }
    if (Array.isArray(data?.favorites)) {
      await favoritesStore.setAll(data.favorites.map(String))
    }
    if (Array.isArray(data?.sessions)) {
      await sessionsStore.replaceAll(data.sessions as Session[])
    }
    syncFromStore()
    showAlert('Daten importiert.')
  } catch (error) {
    console.error('Import failed:', error)
    showAlert('Import fehlgeschlagen. Bitte überprüfe die Datei.')
  }
}

async function resetAll() {
  const ok = await showConfirm('Wirklich alle lokalen Daten löschen?')
  if (!ok) return
  await ensureStoresLoaded()
  await Promise.all([
    settingsStore.clearAll(),
    favoritesStore.clearAll(),
    sessionsStore.clearAll(),
  ])
  syncFromStore()
  showAlert('Alle lokalen Daten wurden gelöscht.')
}
</script>

<style scoped>

/* Ensure the right-side settings panel accounts for device safe-area (status bar)
   so header controls like the "Schließen" button are not hidden on devices
   where the native status bar overlays the WebView. We add the safe-area
   inset to the existing top padding.
*/
.settings-sheet-panel {
  /* Default padding matching p-4 */
  padding-top: var(1rem);
  /* Legacy iOS <11.2 fallback - may trigger linter warnings but needed for old devices */
  padding-top: calc(var(--base-padding) + constant(safe-area-inset-top));
  /* Modern safe-area support for iOS 11.2+ and other platforms */
  padding-top: calc(var(--base-padding) + env(safe-area-inset-top));
}
</style>
