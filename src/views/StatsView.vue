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
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px;">
        <h2 class="label" style="margin:0;">Fähigkeiten je Kategorie</h2>
        <div style="display:flex; gap:8px; align-items:center;">
          <label class="sr-only">Kategorie</label>
          <select v-model="selectedCategory" aria-label="Kategorie filter" data-testid="stats-category">
            <option value="all">Alle Kategorien</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
          <label class="sr-only">Zeitraum</label>
          <select v-model.number="selectedPeriodDays" aria-label="Zeitraum" data-testid="stats-period">
            <option :value="0">Alle</option>
            <option :value="7">7 Tage</option>
            <option :value="30">30 Tage</option>
            <option :value="90">90 Tage</option>
          </select>
        </div>
      </div>
      <div style="margin-top:8px;">
        <CategoryScoresChart v-if="!isEmpty" :scores="scores" title="Fähigkeiten je Kategorie (0–100)" />
        <div v-else class="card" role="status" aria-live="polite">
          <p style="margin:0;">Keine Daten für den gewählten Zeitraum oder Kategorie.</p>
        </div>
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

// Filter controls
const selectedCategory = ref<string>('all')
const selectedPeriodDays = ref<number>(0) // 0 = all

const categories = computed(() => {
  const set = new Set<string>()
  for (const d of catalog.drills) set.add(d.category)
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filteredDrills = computed(() => selectedCategory.value === 'all' ? catalog.drills : catalog.drills.filter(d => d.category === selectedCategory.value))

const filteredSessions = computed(() => {
  let s = sessions.sessions || []
  if (selectedPeriodDays.value && selectedPeriodDays.value > 0) {
    const cutoff = new Date(Date.now() - selectedPeriodDays.value * 24 * 60 * 60 * 1000).toISOString()
    s = s.filter(sess => !!sess.date && sess.date >= cutoff)
  }
  if (selectedCategory.value !== 'all') {
    const allowed = new Set(filteredDrills.value.map(d => d.id))
    s = s.filter(sess => allowed.has(sess.drillId))
  }
  return s
})

const isEmpty = computed(() => (filteredSessions.value || []).length === 0)

const scores = computed(() => computeCategoryScores(filteredSessions.value, filteredDrills.value))

const rows = computed(() => {
  // Show categories alphabetically for stability
  const entries = Object.entries(scores.value || {})
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries.map(([category, value]) => ({ category, value: Math.max(0, Math.min(100, Number(value) || 0)) }))
})
</script>
