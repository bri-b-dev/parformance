<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Sparkline">
    <polyline :points="pointsAttr" :stroke="color" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: number[]
  width?: number
  height?: number
  color?: string
}>()

const width = computed(() => props.width ?? 120)
const height = computed(() => props.height ?? 28)
const color = computed(() => props.color ?? 'currentColor')

const pointsAttr = computed(() => {
  const d = props.data ?? []
  if (!d.length) return ''
  const w = width.value
  const h = height.value
  const min = Math.min(...d)
  const max = Math.max(...d)
  const range = max - min || 1
  const stepX = d.length > 1 ? w / (d.length - 1) : w
  const mapY = (v: number) => h - ((v - min) / range) * h
  return d.map((v, i) => `${i * stepX},${mapY(v)}`).join(' ')
})
</script>
