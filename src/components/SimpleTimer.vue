<template>
  <div class="card timer-card">
    <div class="row" style="align-items:center; justify-content:space-between;">
      <div v-if="presetSeconds && presetSeconds > 0" class="chip" :aria-label="`Voreinstellung ${presetLabel}`">
        🎯 {{ presetLabel }}
      </div>
      <output class="chip" :aria-label="ariaLabel" aria-live="polite">
        ⏱️ {{ formatted }}
      </output>
    </div>

    <div class="row" style="margin-top:8px;">
      <button class="btn btn-primary" type="button" :aria-pressed="running" @click="toggle">
        {{ running ? 'Pause' : 'Start' }}
      </button>
      <button class="btn" type="button" aria-label="Zurücksetzen" @click="onReset">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimer } from '@/composables/useTimer';
import { computed, onMounted, watch } from 'vue';

const props = defineProps<{ presetSeconds?: number; autoStart?: boolean }>()
const emit = defineEmits<(e: 'elapsed', seconds: number) => void>()

const { elapsed, running, start, pause, reset } = useTimer({ presetSeconds: props.presetSeconds })

// Expose controls to parent (e.g., to start automatically when a session begins)
// @ts-ignore defineExpose is available in <script setup>
defineExpose({ start, pause, reset })

function toggle() {
  if (running.value) pause(); else start()
}

function onReset() {
  reset()
  emit('elapsed', 0)
}

watch(elapsed, (sec) => emit('elapsed', sec))

onMounted(() => {
  if (props.autoStart) start()
})

function pad(n: number) { return n.toString().padStart(2, '0') }
const formatted = computed(() => {
  const total = Math.max(0, Math.floor(elapsed.value))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
})

const presetLabel = computed(() => {
  const p = Math.floor((props.presetSeconds ?? 0))
  if (!p) return '0:00'
  const m = Math.floor(p / 60)
  const s = p % 60
  return `${pad(m)}:${pad(s)}`
})

const ariaLabel = computed(() => `Verstrichene Zeit ${formatted.value}`)
</script>

<style scoped>
.timer-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.timer-card .row {
  flex-wrap: wrap;
}
</style>
