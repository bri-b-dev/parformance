<template>
  <form @submit.prevent="onSave" class="space-y-6">
    <!-- Profile / Basics -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">Profil & Basics</h3>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-app-sub">Anzeigename</label>
          <input v-model="local.name" type="text" class="input w-full" placeholder="Optional" />
        </div>
        <div>
          <label class="text-sm text-app-sub">Handicap (HCP)</label>
          <input v-model.number="local.hcp" type="number" step="0.1" min="-10" max="54" class="input w-full" />
        </div>
        <div>
          <label class="text-sm text-app-sub">Schlaghand</label>
          <select v-model="local.handedness" class="input w-full">
            <option value="right">Rechtshänder*in</option>
            <option value="left">Linkshänder*in</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub">Sprache</label>
          <select v-model="local.language" class="input w-full">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-app-sub">Einheiten</label>
          <select v-model="local.units" class="input w-full">
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
          <label class="text-sm text-app-sub">Theme</label>
          <select v-model="local.theme" class="input w-full">
            <option value="system">System</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </div>
        <div class="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
          <div>
            <div class="text-sm font-medium">Soundeffekte</div>
            <div class="text-xs text-app-sub">z. B. Slot-Machine</div>
          </div>
          <input v-model="local.sounds" type="checkbox" class="w-5 h-5" />
        </div>
        <div class="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
          <div>
            <div class="text-sm font-medium">Favoriten bevorzugen</div>
            <div class="text-xs text-app-sub">Shuffle zuerst aus ⭐ Favoriten</div>
          </div>
          <input v-model="local.shuffleFavorites" type="checkbox" class="w-5 h-5" />
        </div>
        <div class="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
          <div>
            <div class="text-sm font-medium">Benachrichtigungen</div>
            <div class="text-xs text-app-sub">z. B. Trainings-Reminder</div>
          </div>
          <input v-model="local.notifications" type="checkbox" class="w-5 h-5" />
        </div>
      </div>
    </section>

    <!-- Data & Privacy -->
    <section class="card p-4">
      <h3 class="text-base font-semibold mb-3">Daten</h3>
      <div class="grid sm:grid-cols-2 gap-3">
        <button type="button" class="btn" @click="$emit('export-data')">Daten exportieren</button>
        <label class="btn cursor-pointer text-center">
          <input type="file" class="hidden" accept="application/json" @change="onImport" />
          Daten importieren
        </label>
      </div>
      <div class="mt-4 p-3 rounded-xl border border-red-200 bg-red-50">
        <div class="text-sm font-medium mb-2">Zurücksetzen</div>
        <div class="flex items-center justify-between">
          <p class="text-sm text-app-sub">Alle lokalen Daten löschen (Sessions, Favoriten, Einstellungen)</p>
          <button class="btn btn-primary" type="button" @click="confirmReset">Reset</button>
        </div>
      </div>
    </section>

    <div class="flex items-center justify-end gap-2">
      <button type="button" class="btn" @click="$emit('cancel')">Abbrechen</button>
      <button type="submit" class="btn btn-primary">Speichern</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch, toRaw } from 'vue'

type Settings = {
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

const props = defineProps<{ modelValue?: Partial<Settings> }>()
const emit = defineEmits<{ (e:'update:modelValue', v:Settings):void; (e:'save', v:Settings):void; (e:'cancel'):void; (e:'export-data'):void; (e:'import-data', v:any):void; (e:'reset'):void }>()

const local = reactive<Settings>({
  name: '',
  hcp: null,
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

function onImport(e: Event){
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try { const data = JSON.parse(String(reader.result)); emit('import-data', data) } catch { /* ignore */ }
  }
  reader.readAsText(file)
}

function confirmReset(){
  if (confirm('Wirklich alle lokalen Daten löschen?')) emit('reset')
}
</script>
