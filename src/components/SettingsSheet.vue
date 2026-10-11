<template>
  <DialogShell v-if="open" variant="side" layer="sheet" labelledby="settings-title" backdrop-testid="settings-backdrop" class="settings-sheet-panel" @close="$emit('close')">
    <div class="flex items-center justify-between mb-2">
      <h2 id="settings-title" class="text-lg font-semibold">{{ $t('app.settings.title') }}</h2>
      <button class="btn" type="button" @click="$emit('close')">{{ $t('app.settings.close') }}</button>
    </div>
    <SettingsForm v-model="formModel" :derived-hcp="derivedHcp" @save="saveAndClose" @cancel="$emit('close')" @replay-onboarding="replayOnboarding" @data-changed="syncFromStore" />
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import SettingsForm from '@/components/settings/SettingsForm.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { useSettingsStore } from '@/stores/settings'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<(e: 'close') => void>()

type FormModel = {
  name: string
  hcp: number | null
  targetHcp: number | null
  targetDate: string | null
  handedness: 'right' | 'left'
  language: 'de' | 'en'
  units: 'metric' | 'imperial'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  shuffleFavorites: boolean
  notifications: boolean
}

const settingsStore = useSettingsStore()
const { hcp: currentHcp, fromRounds } = useCurrentHcp()
const derivedHcp = computed(() => (fromRounds.value ? currentHcp.value : null))

const defaultModel = (): FormModel => ({
  name: settingsStore.name ?? '',
  hcp: typeof settingsStore.hcp === 'number' && Number.isFinite(settingsStore.hcp) ? settingsStore.hcp : null,
  targetHcp: settingsStore.targetHcp ?? null,
  targetDate: settingsStore.targetDate ?? null,
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
    targetHcp: typeof values.targetHcp === 'number' && Number.isFinite(values.targetHcp) ? values.targetHcp : null,
    targetDate: values.targetHcp == null || !values.targetDate ? null : values.targetDate,
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

async function replayOnboarding() {
  await settingsStore.update({ onboardingDone: false })
  emit('close')
}
</script>
