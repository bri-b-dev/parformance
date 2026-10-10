<template>
  <dialog v-if="visible" open class="onb-overlay" aria-labelledby="onb-title" aria-modal="true" @keydown.esc="skip">
    <form class="onb-box" @submit.prevent="save">
      <h2 id="onb-title" class="onb-title">Willkommen bei ParFormance</h2>
      <p class="onb-text">
        Mit deinem Handicap zeigen wir dir für jeden Drill passende Zielwerte. Alles ist optional und später in den Einstellungen änderbar.
      </p>

      <label class="onb-label" for="onb-hcp">Aktuelles Handicap</label>
      <input id="onb-hcp" ref="hcpInput" v-model.number="hcp" class="input" type="number" step="0.1" min="-10" max="54"
        inputmode="decimal" placeholder="z. B. 24,5" />

      <label class="onb-label" for="onb-target">Ziel-Handicap</label>
      <input id="onb-target" v-model.number="targetHcp" class="input" type="number" step="0.1" min="-10" max="54"
        inputmode="decimal" placeholder="z. B. 18" />

      <label class="onb-label" for="onb-date">Ziel erreichen bis</label>
      <input id="onb-date" v-model="targetDate" class="input" type="date" :disabled="targetHcp == null || targetHcp === ''" />

      <p v-if="error" class="onb-error" role="alert">{{ error }}</p>

      <div class="onb-actions">
        <button type="button" class="btn" @click="skip">Überspringen</button>
        <button type="submit" class="btn btn-primary">Los geht's</button>
      </div>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { HCP_MAX, HCP_MIN, useSettingsStore } from '@/stores/settings'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const settings = useSettingsStore()

const hcp = ref<number | '' | null>(null)
const targetHcp = ref<number | '' | null>(null)
const targetDate = ref('')
const error = ref('')
const hcpInput = ref<HTMLInputElement | null>(null)

const visible = computed(() => settings.loaded && !settings.onboardingDone)

onMounted(async () => {
  if (!settings.loaded) await settings.load()
})

watch(visible, async (v) => {
  if (v) {
    await nextTick()
    hcpInput.value?.focus()
  }
}, { immediate: true })

function toNumber(v: number | '' | null): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function outOfRange(v: number | null) {
  return v !== null && (v < HCP_MIN || v > HCP_MAX)
}

async function save() {
  const h = toNumber(hcp.value)
  const t = toNumber(targetHcp.value)
  if (outOfRange(h) || outOfRange(t)) {
    error.value = `Das Handicap muss zwischen ${HCP_MIN} und ${HCP_MAX} liegen.`
    return
  }
  error.value = ''
  await settings.update({
    hcp: h ?? settings.hcp,
    targetHcp: t,
    targetDate: t !== null && targetDate.value ? targetDate.value : null,
    onboardingDone: true,
  })
}

async function skip() {
  await settings.update({ onboardingDone: true })
}
</script>

<style scoped>
.onb-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 20px;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}

.onb-box {
  width: min(440px, 100%);
  max-height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: 16px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.onb-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.onb-text {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 0.95rem;
}

.onb-label {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--muted);
}

.onb-error {
  margin: 4px 0 0;
  color: var(--danger-600, #ef4444);
  font-size: 0.9rem;
}

.onb-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
