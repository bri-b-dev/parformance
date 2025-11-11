<template>
  <div class="field metric-field">
    <div class="metric-input-wrapper" :class="{ disabled }">
      <input :id="inputId" class="metric-input" type="number" :min="effectiveMin ?? undefined"
        :max="max ?? undefined" :placeholder="placeholder" :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="!!error" :disabled="disabled" :step="1" :inputmode="'numeric'" :value="innerValue ?? ''"
        @input="onInput" />
      <span class="metric-suffix" aria-hidden="true">{{ unit }}</span>
    </div>
    <output v-if="error" :id="`${inputId}-error`" class="metric-error" aria-live="polite">{{ error }}</output>
  </div>
</template>

<script setup lang="ts">
import { validateDrillResult } from '@/metrics/validation';
import type { Drill } from '@/types';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  drill: Drill
  modelValue?: number | null
  /** Optional lower bound; defaults to 1 to ensure >0 as acceptance criterion */
  min?: number
  /** Optional upper bound */
  max?: number
  /** When true, the input is disabled */
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const inputId = `metric-${Math.random().toString(36).slice(2)}`
const innerValue = ref<number | null>(props.modelValue ?? null)

watch(() => props.modelValue, (v) => { innerValue.value = v ?? null })

const unit = computed(() => props.drill.metric.unit)
const placeholder = computed(() => (props.disabled ? 'Session starten, um einzutragen' : 'Messwert eingeben'))

// Effective min: use provided prop, otherwise default to 1 (validates numeric value > 0)
const effectiveMin = computed<number | undefined>(() => {
  if (typeof props.min === 'number') return props.min
  return 1
})

const max = computed(() => props.max)

const error = computed(() => {
  // First use domain-specific validation
  const base = validateDrillResult(props.drill, innerValue.value)
  if (base) return base
  // Then enforce generic min/max if provided
  const v = innerValue.value
  if (v == null) return null
  return null
})

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  const val = t.value === '' ? null : Number(t.value)
  innerValue.value = val
  emit('update:modelValue', val)
}
</script>

<style scoped>
.metric-field {
  gap: 8px;
}

.metric-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding-right: 12px;
  background: var(--surface);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.metric-input-wrapper:focus-within {
  border-color: color-mix(in oklab, var(--primary) 65%, var(--border));
  box-shadow: 0 0 0 4px var(--ring);
}

.metric-input-wrapper.disabled {
  opacity: .65;
}

.metric-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 12px;
  font-size: 1rem;
  color: inherit;
  outline: none;
}

.metric-input:disabled {
  cursor: not-allowed;
}

.metric-suffix {
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary) 6%, var(--surface));
  color: var(--muted);
  font-size: .8rem;
  font-weight: 600;
  white-space: nowrap;
}

.metric-error {
  color: #dc2626;
  font-size: .85rem;
}
</style>
