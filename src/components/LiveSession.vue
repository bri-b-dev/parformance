<template>
  <DialogShell variant="full" layer="sheet" labelledby="live-title" initial-focus=".metric-input" class="live" data-testid="live" @close="emit('cancel')">
    <header class="live-head">
      <h2 id="live-title" class="live-title">{{ drill.title }}</h2>
      <button type="button" class="btn" data-testid="live-cancel" @click="emit('cancel')">Abbrechen</button>
    </header>

    <!-- Timer -->
    <section v-if="preset" class="live-timer" aria-label="Timer">
      <output class="live-clock" :class="{ over: overtime }" role="timer" aria-live="off" data-testid="live-clock">{{ clock(elapsed) }}</output>
      <p class="muted live-preset">von {{ clock(preset) }}<span v-if="overtime"> - Zeit abgelaufen</span></p>
      <div class="live-bar" role="progressbar" aria-label="Zeit" aria-valuemin="0" :aria-valuemax="preset" :aria-valuenow="Math.min(elapsed, preset)">
        <div class="live-bar-fill" :class="{ over: overtime }" :style="{ width: Math.min(100, (elapsed / preset) * 100) + '%' }"></div>
      </div>
      <div class="live-timer-actions">
        <button type="button" class="btn" :aria-pressed="running" data-testid="live-pause" @click="toggleTimer">{{ running ? 'Pause' : 'Weiter' }}</button>
        <button type="button" class="btn" data-testid="live-reset" @click="resetTimer">Zurücksetzen</button>
      </div>
    </section>

    <!-- Result -->
    <section class="live-value" aria-label="Ergebnis">
      <p class="live-unit">{{ drill.metric.unit }}</p>
      <div class="live-stepper">
        <button type="button" class="btn live-step" :disabled="minusDisabled" aria-label="Wert um 1 verringern" data-testid="live-minus" @click="step(-1)">−</button>
        <MetricValueInput :model-value="value" :drill="drill" class="live-input" @update:model-value="emit('update:value', $event)" />
        <button type="button" class="btn live-step" :disabled="plusDisabled" aria-label="Wert um 1 erhöhen" data-testid="live-plus" @click="step(1)">+</button>
      </div>
      <div v-if="drill.metric.type === 'count_in_time'" class="live-attempts">
        <button type="button" class="btn live-attempt" :aria-label="`+1 Versuch zu ${drill.title}`" data-testid="attempts-inc" @click="emit('update:attempts', attempts + 1)">+1 Versuch</button>
        <output class="chip" aria-live="polite" data-testid="attempts-chip">Versuche: {{ attempts }}</output>
      </div>
    </section>

    <!-- Instructions on demand -->
    <section class="live-flow">
      <button type="button" class="btn" :aria-expanded="showFlow" aria-controls="live-flow-text" data-testid="live-flow-toggle" @click="showFlow = !showFlow">{{ showFlow ? 'Ablauf verbergen' : 'Ablauf anzeigen' }}</button>
      <div v-if="showFlow" id="live-flow-text" class="live-flow-text" data-testid="live-flow">
        <p v-if="drill.instructions.training">{{ drill.instructions.training }}</p>
        <p v-if="drill.instructions.test" class="muted">{{ drill.instructions.test }}</p>
      </div>
    </section>

    <footer class="live-foot">
      <button type="button" class="btn btn-primary live-save" :disabled="!canSave" data-testid="live-save" @click="emit('save')">Speichern</button>
    </footer>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import MetricValueInput from '@/components/MetricValueInput.vue'
import { useTimer } from '@/composables/useTimer'
import { useWakeLock } from '@/composables/useWakeLock'
import type { Drill } from '@/types'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{ drill: Drill; value: number | null; attempts: number }>()
const emit = defineEmits<{
  (e: 'update:value', v: number | null): void
  (e: 'update:attempts', v: number): void
  (e: 'elapsed', seconds: number): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const showFlow = ref(false)

// the screen stays on while this view is open
useWakeLock(ref(true))

// timer: only for drills with a time preset; starts right away
const preset = computed(() => props.drill.duration?.timerPreset ?? 0)
const { elapsed, running, start, pause, reset } = useTimer({ presetSeconds: preset.value })
const overtime = computed(() => preset.value > 0 && elapsed.value > preset.value)

function toggleTimer() {
  if (running.value) pause(); else start()
}
function resetTimer() {
  reset()
  emit('elapsed', 0)
}
watch(elapsed, (s) => emit('elapsed', s))

function clock(sec: number) {
  const m = Math.floor(sec / 60)
  return `${String(m).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

// value stepper: bounds follow the metric (an explicit range wins, streaks/counts must be >= 1)
const bounds = computed(() => {
  const m = props.drill.metric
  if (m.range) return { min: m.range[0], max: m.range[1] }
  if (m.type === 'streak' || m.type === 'count_in_time') return { min: 1, max: Infinity }
  if (m.type === 'score_vs_par') return { min: -Infinity, max: Infinity }
  return { min: 0, max: Infinity }
})

const minusDisabled = computed(() => props.value !== null && props.value <= bounds.value.min)
const plusDisabled = computed(() => props.value !== null && props.value >= bounds.value.max)

function step(delta: 1 | -1) {
  const { min, max } = bounds.value
  let next: number
  if (props.value === null) next = Number.isFinite(min) ? min : delta // from an empty field: first valid value
  else next = props.value + delta
  emit('update:value', Math.min(max, Math.max(min, next)))
}

const canSave = computed(() => props.value !== null && Number.isFinite(props.value))

onMounted(() => {
  if (preset.value > 0) start()
})
</script>

<style scoped>
.live {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.live-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.live-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}

.live-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.live-clock {
  font-size: clamp(3.5rem, 22vw, 6rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.live-clock.over {
  color: var(--danger-ink);
}

.live-preset {
  margin: 0;
}

.live-bar {
  width: 100%;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--border);
  overflow: hidden;
}

.live-bar-fill {
  height: 100%;
  background: var(--primary);
}

.live-bar-fill.over {
  background: var(--danger-ink);
}

.live-timer-actions {
  display: flex;
  gap: 8px;
}

.live-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.live-unit {
  margin: 0;
  color: var(--muted);
  text-align: center;
}

.live-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.live-step {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  font-size: 2rem;
  line-height: 1;
  padding: 0;
}

.live-input {
  flex: 1;
  min-width: 0;
  max-width: 220px;
}

.live-input :deep(.metric-input) {
  font-size: 2.2rem;
  font-weight: 700;
  text-align: center;
}

.live-input :deep(.metric-suffix) {
  display: none;
}

.live-attempts {
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-attempt {
  min-height: 56px;
  font-size: 1.1rem;
}

.live-flow {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-flow-text p {
  margin: 0 0 8px;
}

.live-foot {
  margin-top: auto;
}

.live-save {
  width: 100%;
  min-height: 60px;
  font-size: 1.2rem;
}
</style>
