<template>
  <div class="card" style="max-width:360px;">
    <div class="row" style="align-items:center; justify-content:space-between;">
      <div class="chip" :aria-label="`Voreinstellung ${presetLabel}`" v-if="presetSeconds && presetSeconds > 0">
        🎯 {{ presetLabel }}
      </div>
      <div class="chip" :aria-label="ariaLabel" role="status" aria-live="polite">
        ⏱️ {{ formatted }}
      </div>
    </div>

    <div class="row" style="margin-top:8px;">
      <button class="btn btn-primary" type="button" @click="toggle" :aria-pressed="running">
        {{ running ? 'Pause' : 'Start' }}
      </button>
      <button class="btn" type="button" @click="onReset" aria-label="Zurücksetzen">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useTimer } from '@/composables/useTimer'

const props = defineProps<{ presetSeconds?: number; autoStart?: boolean }>()
const emit = defineEmits<{ (e: 'elapsed', seconds: number): void }>()

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
