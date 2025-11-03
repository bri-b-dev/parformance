<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-semibold mb-4">Einstellungen</h2>
    <SettingsForm v-model="formModel" @save="save" @export-data="exportData" @import-data="importData"
      @reset="resetAll" />
  </div>
</template>

<script setup lang="ts">
import SettingsForm from '@/components/settings/SettingsForm.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { Session } from '@/types'
import { onMounted, ref, watch } from 'vue'

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

async function ensureStoresLoaded() {
  if (!settingsStore.loaded) await settingsStore.load()
  if (!favoritesStore.loaded) await favoritesStore.load()
  if (!sessionsStore.loaded) await sessionsStore.load()
}

function syncFromStore() {
  formModel.value = defaultModel()
}

onMounted(async () => {
  await ensureStoresLoaded()
  syncFromStore()
})

watch(() => settingsStore.loaded, (loaded) => {
  if (loaded) syncFromStore()
})

function downloadJson(filename: string, data: any) {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function showAlert(message: string) {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(message)
}

async function save(values: FormModel) {
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
  showAlert('Einstellungen gespeichert.')
  syncFromStore()
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
  downloadJson('parformance-export.json', payload)
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
      await favoritesStore.setAll(data.favorites.map((id: any) => String(id)))
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
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (!window.confirm('Wirklich alle lokalen Daten löschen?')) return
  }
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
