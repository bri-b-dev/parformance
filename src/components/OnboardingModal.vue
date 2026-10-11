<template>
  <DialogShell v-if="visible" variant="center" layer="modal" labelledby="onb-title" :backdrop-close="false" initial-focus='input[type="text"]' class="onb" @close="finish">
    <form class="onb-box" @submit.prevent="onSubmit">
      <header class="onb-head">
        <p class="onb-step" data-testid="onb-step">Schritt {{ step }} von 2</p>
        <button type="button" class="btn onb-close" aria-label="Einführung schließen" data-testid="onb-close" @click="finish">✕</button>
      </header>
      <div class="onb-dots" aria-hidden="true"><span :class="{ on: step >= 1 }"></span><span :class="{ on: step >= 2 }"></span></div>

      <!-- Step 1: current handicap -->
      <template v-if="step === 1">
        <h2 id="onb-title" class="onb-title">Willkommen bei ParFormance</h2>
        <p class="onb-text">Mit deinem Handicap zeigen wir dir für jeden Drill passende Zielwerte. Alles ist optional und später in den Einstellungen änderbar.</p>
        <template v-if="!fromRounds">
          <label class="onb-label" for="onb-hcp">Dein aktuelles Handicap</label>
          <HcpInput id="onb-hcp" v-model="hcp" label="Aktuelles Handicap" :start-value="30" />
          <p class="onb-hint">Oder erfasse Runden im Bereich Handicap, dann wird es daraus berechnet.</p>
        </template>
        <p v-else class="onb-hint" data-testid="onb-from-rounds">Dein Handicap wird aus deinen Runden berechnet.</p>
      </template>

      <!-- Step 2: goal -->
      <template v-else>
        <h2 id="onb-title" class="onb-title">Dein Ziel</h2>
        <p class="onb-text">Wohin soll es gehen? Wir zeigen dir dann, was dir bis dahin noch fehlt.</p>
        <label class="onb-label" for="onb-target">Ziel-Handicap</label>
        <HcpInput id="onb-target" v-model="targetHcp" label="Ziel-Handicap" :start-value="startTarget" />
        <p v-if="targetAboveCurrent" class="onb-hint" role="note" data-testid="onb-target-warn">Dein Ziel liegt über deinem aktuellen Handicap.</p>

        <label class="onb-label" for="onb-date">Ziel erreichen bis (optional)</label>
        <input id="onb-date" v-model="targetDate" class="input" type="date" :min="today" :disabled="targetHcp === null" data-testid="onb-date" />
        <div class="onb-quick" role="group" aria-label="Schnellauswahl Zieldatum">
          <button v-for="q in QUICK" :key="q.months" type="button" class="chip onb-chip" :disabled="targetHcp === null" @click="targetDate = inMonths(q.months)">{{ q.label }}</button>
        </div>
      </template>

      <p v-if="error" class="onb-error" role="alert">{{ error }}</p>

      <div class="onb-actions">
        <button v-if="step === 2" type="button" class="btn" data-testid="onb-back" @click="step = 1">Zurück</button>
        <span class="onb-spacer"></span>
        <button type="button" class="btn" data-testid="onb-skip" @click="skipStep">Überspringen</button>
        <button type="submit" class="btn btn-primary" data-testid="onb-next">{{ step === 1 ? 'Weiter' : 'Los geht\'s' }}</button>
      </div>
    </form>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import HcpInput from '@/components/HcpInput.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { dayKey } from '@/focus/active'
import { useSettingsStore } from '@/stores/settings'
import { computed, onMounted, ref, watch } from 'vue'

const QUICK = [
  { months: 3, label: '3 Monate' },
  { months: 6, label: '6 Monate' },
  { months: 12, label: '12 Monate' },
]

const settings = useSettingsStore()
const { hcp: currentHcp, fromRounds } = useCurrentHcp()

const step = ref<1 | 2>(1)
const hcp = ref<number | null>(null)
const targetHcp = ref<number | null>(null)
const targetDate = ref('')
const error = ref('')
const today = dayKey(new Date())

const visible = computed(() => settings.loaded && !settings.onboardingDone)

// the HCP that counts for the goal: what was just entered, else what is known
const known = computed(() => hcp.value ?? currentHcp.value)
const startTarget = computed(() => (known.value !== null ? Math.max(0, Math.round((known.value - 4) * 10) / 10) : 18))
const targetAboveCurrent = computed(() => known.value !== null && targetHcp.value !== null && targetHcp.value > known.value)

onMounted(async () => {
  if (!settings.loaded) await settings.load()
})

watch(visible, (v) => { if (v) step.value = 1 }, { immediate: true })

async function persist() {
  const payload: Parameters<typeof settings.update>[0] = { onboardingDone: true }
  if (hcp.value !== null) payload.hcp = hcp.value
  if (targetHcp.value !== null) {
    payload.targetHcp = targetHcp.value
    payload.targetDate = targetDate.value || null
  }
  await settings.update(payload)
}

async function finish() {
  error.value = ''
  await persist()
}

async function onSubmit() {
  if (step.value === 1) {
    step.value = 2
    return
  }
  await finish()
}

/** Skip the current step: step 1 moves on without storing a HCP, step 2 closes the dialog. */
async function skipStep() {
  if (step.value === 1) {
    hcp.value = null
    step.value = 2
    return
  }
  targetHcp.value = null
  targetDate.value = ''
  await finish()
}

function inMonths(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return dayKey(d)
}
</script>

<style scoped>
.onb {
  --dlg-width: 440px;
}

.onb-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.onb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.onb-step {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.onb-close {
  min-width: 36px;
  min-height: 36px;
  padding: 0;
}

.onb-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.onb-dots span {
  height: 4px;
  flex: 1;
  border-radius: 999px;
  background: var(--border);
}

.onb-dots span.on {
  background: var(--primary);
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

.onb-hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.onb-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.onb-chip {
  cursor: pointer;
}

.onb-chip:disabled {
  opacity: 0.5;
  cursor: default;
}

.onb-error {
  margin: 4px 0 0;
  color: var(--danger-ink);
  font-size: 0.9rem;
}

.onb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.onb-spacer {
  flex: 1;
}
</style>
