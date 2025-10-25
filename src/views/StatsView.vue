<template>
  <section class="p-4 container">
    <h1 class="text-xl font-semibold">Stats</h1>

    <!-- Loading state -->
    <div v-if="!drillsLoaded || !sessionsLoaded" class="p-4 flex items-center text-sm text-gray-600" role="status" aria-live="polite">
      <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-hidden="true"></span>
      Lädt…
    </div>

    <!-- Content -->
    <div v-else>
      <h2 class="label" style="margin-top:8px;">Fähigkeiten je Kategorie</h2>
      <CategoryScoresChart :scores="scores" title="Fähigkeiten je Kategorie (0–100)" />
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { computeCategoryScores } from '@/stats/categoryScores'
import CategoryScoresChart from '@/components/CategoryScoresChart.vue'

const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
  if (!sessions.loaded) await sessions.load()
})

const drillsLoaded = computed(() => catalog.loaded)
const sessionsLoaded = computed(() => sessions.loaded)

const scores = computed(() => computeCategoryScores(sessions.sessions, catalog.drills))

const rows = computed(() => {
  // Show categories alphabetically for stability
  const entries = Object.entries(scores.value || {})
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries.map(([category, value]) => ({ category, value: Math.max(0, Math.min(100, Number(value) || 0)) }))
})
</script>
