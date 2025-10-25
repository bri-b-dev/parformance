<template>
  <div class="field">
    <label class="label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      class="input"
      type="number"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      :aria-invalid="!!error"
      :step="1"
      :inputmode="'numeric'"
      :value="innerValue ?? ''"
      @input="onInput"
    />
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const inputId = `metric-${Math.random().toString(36).slice(2)}`
const innerValue = ref<number | null>(props.modelValue ?? null)

watch(() => props.modelValue, (v) => { innerValue.value = v ?? null })

const label = computed(() => props.label ?? props.drill.metric.unit)

const error = computed(() => validateDrillResult(props.drill, innerValue.value))

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  const val = t.value === '' ? null : Number(t.value)
  innerValue.value = val
  emit('update:modelValue', val)
}
</script>
