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
      <h2 class="label" style="margin-top:8px;">Durchschnittlicher Level je Kategorie</h2>
      <div role="img" aria-label="Balkendiagramm: Normalisierte Durchschnitts-Level pro Kategorie" class="card" style="margin-top:6px;">
        <ul class="list-none" style="padding:8px; margin:0; display:flex; flex-direction:column; gap:8px;">
          <li v-for="row in rows" :key="row.category" style="display:flex; align-items:center; gap:10px;">
            <div style="width:160px; color:var(--muted);">{{ row.category }}</div>
            <div class="w-full" style="flex:1; height:12px; background: var(--bg); border:1px solid var(--border); border-radius:999px; overflow:hidden;">
              <div :style="{ width: row.value + '%', height: '100%', background: 'var(--accent-green)' }" aria-hidden="true"></div>
            </div>
            <div class="chip" :aria-label="`${row.value.toFixed(0)} Prozent`" style="min-width:56px; text-align:right;">{{ row.value.toFixed(0) }}%</div>
          </li>
        </ul>
      </div>

      <!-- Radar placeholder -->
      <div class="card" role="img" aria-label="Radar-Diagramm Platzhalter" style="margin-top:10px; height:180px; display:flex; align-items:center; justify-content:center; color:var(--muted);">
        Radar (Platzhalter)
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { computeCategoryScores } from '@/stats/categoryScores'

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
