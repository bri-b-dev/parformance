<template>
  <form class="space-y-6" @submit.prevent="onSave">
    <!-- Profile / Basics -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">Profil & Basics</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-app-sub" for="settings-name">Anzeigename</label>
          <input id="settings-name" v-model="local.name" type="text" class="input w-full" placeholder="Optional" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-hcp">Handicap (HCP)</label>
          <HcpInput v-if="derivedHcp == null" id="settings-hcp" v-model="local.hcp" label="Handicap" :start-value="30" />
          <input v-else id="settings-hcp" :value="formatHcp(derivedHcp)" type="text" class="input w-full" disabled aria-describedby="settings-hcp-note" />
          <p v-if="derivedHcp != null" id="settings-hcp-note" class="text-xs text-app-sub mt-1">Aus deinen Runden berechnet (Bereich Handicap).</p>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-target-hcp">Ziel-Handicap</label>
          <HcpInput id="settings-target-hcp" v-model="local.targetHcp" label="Ziel-Handicap" :start-value="local.hcp !== null ? Math.max(0, local.hcp - 4) : 18" placeholder="Optional" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-target-date">Ziel bis</label>
          <input id="settings-target-date" v-model="local.targetDate" type="date" class="input w-full" :disabled="local.targetHcp == null" />
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-hand">Schlaghand</label>
          <select id="settings-hand" v-model="local.handedness" class="input w-full">
            <option value="right">Rechtshänder*in</option>
            <option value="left">Linkshänder*in</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-lang">Sprache</label>
          <select id="settings-lang" v-model="local.language" class="input w-full">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub" for="settings-units">Einheiten</label>
          <select id="settings-units" v-model="local.units" class="input w-full">
            <option value="metric">Metrisch (m, km/h)</option>
            <option value="imperial">Imperial (yd, mph)</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Appearance & UX -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">Darstellung & UX</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-app-sub" for="settings-theme">Theme</label>
          <select id="settings-theme" v-model="local.theme" class="input w-full">
            <option value="system">System</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </div>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">Soundeffekte</span>
            <span class="block text-xs text-app-sub">z. B. Slot-Machine</span>
          </span>
          <input v-model="local.sounds" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">Favoriten bevorzugen</span>
            <span class="block text-xs text-app-sub">Shuffle zuerst aus Favoriten</span>
          </span>
          <input v-model="local.shuffleFavorites" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
        <label class="flex items-center justify-between px-3 py-2 switch-row">
          <span>
            <span class="block text-sm font-medium">Benachrichtigungen</span>
            <span class="block text-xs text-app-sub">z. B. Trainings-Reminder</span>
          </span>
          <input v-model="local.notifications" type="checkbox" role="switch" class="w-5 h-5" />
        </label>
      </div>
    </section>

    <!-- Data & Privacy -->
    <DataPanel @replay-onboarding="$emit('replay-onboarding')" @changed="$emit('data-changed')" />

    <div class="flex items-center justify-end gap-2">
      <button type="button" class="btn" @click="$emit('cancel')">Abbrechen</button>
      <button type="submit" class="btn btn-primary">Speichern</button>
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
