<template>
  <form class="space-y-6" @submit.prevent="onSave">
    <!-- Profile / Basics -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">{{ $t('app.settings.profile') }}</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-app-sub" for="settings-name">{{ $t('app.settings.name') }}</label>
          <input id="settings-name" v-model="local.name" type="text" class="input w-full" :placeholder="$t('app.settings.optional')" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-hcp">{{ $t('app.settings.hcp') }}</label>
          <HcpInput v-if="derivedHcp == null" id="settings-hcp" v-model="local.hcp" :label="$t('app.settings.hcp')" :start-value="30" />
          <input v-else id="settings-hcp" :value="formatHcp(derivedHcp)" type="text" class="input w-full" disabled aria-describedby="settings-hcp-note" />
          <p v-if="derivedHcp != null" id="settings-hcp-note" class="text-xs text-app-sub mt-1">{{ $t('app.settings.hcpFromRounds') }}</p>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-target-hcp">{{ $t('app.settings.targetHcp') }}</label>
          <HcpInput id="settings-target-hcp" v-model="local.targetHcp" :label="$t('app.settings.targetHcp')" :start-value="local.hcp !== null ? Math.max(0, local.hcp - 4) : 18" :placeholder="$t('app.settings.optional')" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-target-date">{{ $t('app.settings.targetDate') }}</label>
          <input id="settings-target-date" v-model="local.targetDate" type="date" class="input w-full" :disabled="local.targetHcp == null" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-hand">{{ $t('app.settings.handedness') }}</label>
          <select id="settings-hand" v-model="local.handedness" class="input w-full">
            <option value="right">{{ $t('app.settings.right') }}</option>
            <option value="left">{{ $t('app.settings.left') }}</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-lang">{{ $t('app.settings.language') }}</label>
          <select id="settings-lang" v-model="local.language" class="input w-full">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-units">{{ $t('app.settings.units') }}</label>
          <select id="settings-units" v-model="local.units" class="input w-full">
            <option value="metric">{{ $t('app.settings.metric') }}</option>
            <option value="imperial">{{ $t('app.settings.imperial') }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Appearance & UX -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">{{ $t('app.settings.appearance') }}</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-app-sub" for="settings-theme">{{ $t('app.settings.theme') }}</label>
          <select id="settings-theme" v-model="local.theme" class="input w-full">
            <option value="system">{{ $t('app.settings.system') }}</option>
            <option value="light">{{ $t('app.settings.light') }}</option>
            <option value="dark">{{ $t('app.settings.dark') }}</option>
          </select>
        </div>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">{{ $t('app.settings.sounds') }}</span>
            <span class="block text-xs text-app-sub">{{ $t('app.settings.soundsHint') }}</span>
          </span>
          <input v-model="local.sounds" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">{{ $t('app.settings.favorites') }}</span>
            <span class="block text-xs text-app-sub">{{ $t('app.settings.favoritesHint') }}</span>
          </span>
          <input v-model="local.shuffleFavorites" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">{{ $t('app.settings.notifications') }}</span>
            <span class="block text-xs text-app-sub">{{ $t('app.settings.notificationsHint') }}</span>
          </span>
          <input v-model="local.notifications" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
      </div>
    </section>

    <!-- Data & Privacy -->
    <DataPanel @replay-onboarding="$emit('replay-onboarding')" @changed="$emit('data-changed')" />

    <div class="flex items-center justify-end gap-2">
      <button type="button" class="btn" @click="$emit('cancel')">{{ $t('app.settings.cancel') }}</button>
      <button type="submit" class="btn btn-primary">{{ $t('app.settings.save') }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import DataPanel from '@/components/DataPanel.vue'
import HcpInput from '@/components/HcpInput.vue'
import { formatHcp } from '@/hcp/format'
import { reactive, watch, toRaw } from 'vue'

type Settings = {
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

const props = defineProps<{ modelValue?: Partial<Settings>; derivedHcp?: number | null }>()
const emit = defineEmits<{ (e:'update:modelValue', v:Settings):void; (e:'save', v:Settings):void; (e:'cancel'):void; (e:'replay-onboarding'):void; (e:'data-changed'):void }>()

const local = reactive<Settings>({
  name: '',
  hcp: null,
  targetHcp: null,
  targetDate: null,
  handedness: 'right',
  language: 'de',
  units: 'metric',
  theme: 'system',
  sounds: true,
  shuffleFavorites: false,
  notifications: false,
  ...(props.modelValue || {}) as any,
})

watch(local, () => emit('update:modelValue', structuredClone(toRaw(local))), { deep: true })
watch(() => props.modelValue, (value) => {
  if (!value) return
  Object.assign(local, value as Partial<Settings>)
}, { deep: true })

function onSave(){ emit('save', structuredClone(toRaw(local))) }

</script>

<style scoped>
.switch-row {
  background: color-mix(in oklab, var(--bg) 70%, var(--surface));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>
