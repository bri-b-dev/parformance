<template>
  <div class="hcp-input">
    <div class="hcp-row">
      <button type="button" class="btn hcp-step" :aria-label="`${label} um 0,1 verringern`" data-testid="hcp-minus" @click="step(-0.1)">−</button>
      <input :id="id" ref="field" v-model="text" class="input hcp-field" type="text" inputmode="decimal" autocomplete="off" :placeholder="placeholder"
        :aria-label="id ? undefined : label" :aria-invalid="invalid" data-testid="hcp-field" @input="onInput" @blur="onBlur" />
      <button type="button" class="btn hcp-step" :aria-label="`${label} um 0,1 erhöhen`" data-testid="hcp-plus" @click="step(0.1)">+</button>
    </div>
    <input class="hcp-slider" type="range" :min="HCP_MIN" :max="HCP_MAX" step="0.1" :value="modelValue ?? startValue" :aria-label="`${label} (Schieberegler)`"
      data-testid="hcp-slider" @input="onSlider" />
    <p v-if="invalid" class="hcp-error" role="alert">Bitte eine Zahl zwischen {{ formatHcp(HCP_MIN) }} und {{ formatHcp(HCP_MAX) }} eingeben.</p>
    <p v-else-if="modelValue !== null && modelValue < 0" class="hcp-note">Plus-Handicap: besser als Scratch.</p>
  </div>
</template>

<script setup lang="ts">
import { clampHcp, formatHcp, parseHcp } from '@/hcp/format'
import { HCP_MAX, HCP_MIN } from '@/stores/settings'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number | null
  id?: string
  label?: string
  placeholder?: string
  /** Where the stepper/slider start while no value is set. */
  startValue?: number
}>(), { id: undefined, label: 'Handicap', placeholder: 'z. B. 24,5', startValue: 30 })

const emit = defineEmits<(e: 'update:modelValue', v: number | null) => void>()

const text = ref(formatHcp(props.modelValue))
const invalid = ref(false)

// Keep the text in sync when the value is changed from outside. Our own updates are skipped, otherwise
// invalid text (which clears the model) would be wiped before the error message can be shown.
let lastEmitted: number | null | undefined
function update(v: number | null) {
  lastEmitted = v
  emit('update:modelValue', v)
}

watch(() => props.modelValue, (v) => {
  if (v === lastEmitted) return
  text.value = formatHcp(v)
})

// While typing an unfinished or invalid value ("+", "99") the model is cleared so a stale number is never saved;
// the error message only appears when the field loses focus.
function onInput() {
  const parsed = parseHcp(text.value)
  if (parsed.ok) invalid.value = false
  update(parsed.ok ? parsed.value : null)
}

function onBlur() {
  const parsed = parseHcp(text.value)
  invalid.value = !parsed.ok
  if (parsed.ok) text.value = formatHcp(parsed.value)
}

function step(delta: number) {
  invalid.value = false
  const base = props.modelValue ?? props.startValue
  const next = props.modelValue === null ? base : clampHcp(base + delta)
  update(next)
  text.value = formatHcp(next)
}

function onSlider(e: Event) {
  invalid.value = false
  const v = clampHcp(Number((e.target as HTMLInputElement).value))
  update(v)
  text.value = formatHcp(v)
}
</script>

<style scoped>
.hcp-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hcp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hcp-step {
  min-width: 44px;
  min-height: 44px;
  font-size: 1.3rem;
  line-height: 1;
  padding: 0;
}

.hcp-field {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
}

.hcp-slider {
  width: 100%;
  accent-color: var(--primary);
}

.hcp-error {
  margin: 0;
  color: var(--danger-600, #ef4444);
  font-size: 0.9rem;
}

.hcp-note {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
