<template>
  <div class="field">
    <label class="label" :for="inputId">{{ label }}</label>
    <div class="row" style="align-items:center;">
      <input
        :id="inputId"
        class="input"
        type="number"
        :min="effectiveMin ?? undefined"
        :max="max ?? undefined"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="!!error"
        :step="1"
        :inputmode="'numeric'"
        :value="innerValue ?? ''"
        @input="onInput"
        style="flex:1;"
      />
      <span class="chip" aria-hidden="true">{{ unit }}</span>
    </div>
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="text-sm text-red-600 mt-1"
      role="status"
      aria-live="polite"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Drill } from '@/types'
import { validateDrillResult } from '@/metrics/validation'

const props = defineProps<{
  drill: Drill
  modelValue?: number | null
  label?: string
  /** Optional lower bound; defaults to 1 to ensure >0 as acceptance criterion */
  min?: number
  /** Optional upper bound */
  max?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const inputId = `metric-${Math.random().toString(36).slice(2)}`
const innerValue = ref<number | null>(props.modelValue ?? null)

watch(() => props.modelValue, (v) => { innerValue.value = v ?? null })

const unit = computed(() => props.drill.metric.unit)
const label = computed(() => props.label ?? unit.value)

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
  if (typeof effectiveMin.value === 'number' && v < effectiveMin.value) {
    return `${label.value} muss ≥ ${effectiveMin.value} sein`
  }
  if (typeof max.value === 'number' && v > max.value) {
    return `${label.value} muss ≤ ${max.value} sein`
  }
  return null
})

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  const val = t.value === '' ? null : Number(t.value)
  innerValue.value = val
  emit('update:modelValue', val)
}
</script>
