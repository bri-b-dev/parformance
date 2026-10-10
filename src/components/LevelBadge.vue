<template>
  <LevelStars :level="level" :compact="compact" :title="tooltip" />
</template>

<script setup lang="ts">
import LevelStars from '@/components/LevelStars.vue'
import { evaluateSessionLevel } from '@/hcp/evaluator'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { Drill } from '@/types'
import { computed, onMounted } from 'vue'

/** Level of the latest session of a drill, evaluated with the current handicap (null without a session). */
const props = defineProps<{ drill: Drill; compact?: boolean }>()

const sessions = useSessionsStore()
const settings = useSettingsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
})

const latest = computed(() => sessions.latestByDrill(props.drill.id))
const level = computed<number | null>(() => (latest.value ? evaluateSessionLevel(latest.value, props.drill, 'current') : null))
const tooltip = computed(() => (level.value === null ? 'Noch kein Ergebnis in diesem Drill' : `Level ${level.value} von 3 - letzte Session, mit deinem aktuellen Handicap bewertet`))
</script>
