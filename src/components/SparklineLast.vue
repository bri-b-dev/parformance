<template>
  <Sparkline :data="lastValues" :width="width" :height="height" :color="color" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const props = defineProps<{
  /** numeric array of values (preferred) */
  values?: number[]
  /** fallback: array of session-like objects with `result.value` */
  sessions?: any[]
  limit?: number
  width?: number
  height?: number
  color?: string
}>()

const limit = computed(() => props.limit ?? 10)
const width = computed(() => props.width ?? 120)
const height = computed(() => props.height ?? 28)
const color = computed(() => props.color ?? 'currentColor')

const lastValues = computed(() => {
  let vals: number[] = []
  if (Array.isArray(props.values) && props.values.length) {
    vals = props.values.filter(v => typeof v === 'number' && Number.isFinite(v))
  } else if (Array.isArray(props.sessions) && props.sessions.length) {
    vals = props.sessions.map(s => {
      if (s == null) return NaN
      // support either s.result?.value or s.value
      const v = s?.result?.value ?? s?.value ?? NaN
      return typeof v === 'number' && Number.isFinite(v) ? v : NaN
    }).filter(v => Number.isFinite(v))
  }
  if (!vals.length) return []
  if (vals.length <= limit.value) return vals.slice()
  return vals.slice(-limit.value)
})
</script>
