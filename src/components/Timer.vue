<template>
  <div class="chip" :aria-label="ariaLabel">
    ⏱️ {{ formatted }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Seconds to display */
  seconds: number
  /** Optional label for screen readers */
  label?: string
}>()

function pad(n: number) { return n.toString().padStart(2, '0') }

const formatted = computed(() => {
  const total = Math.max(0, Math.floor(props.seconds || 0))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
})

const ariaLabel = computed(() => props.label ?? `Timer ${formatted.value}`)
</script>
