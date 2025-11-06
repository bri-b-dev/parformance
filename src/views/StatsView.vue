<template>
  <section class="container">
    <h1 class="text-xl font-semibold">Statistiken</h1>

    <!-- Loading state -->
    <output v-if="!drillsLoaded || !sessionsLoaded" class="p-4 flex items-center text-sm text-gray-600"
      aria-live="polite">
      <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"
        aria-hidden="true"></span>
      Lädt…
    </output>

    <!-- Content -->
    <div v-else>
      <div v-if="hasAnySessions" class="stats-content">
        <div class="heading-row">
          <h2 class="label" style="margin:0;">Fähigkeiten je Kategorie</h2>
          <div class="filter-row">
            <label for="category-select" class="sr-only">Kategorie</label>
            <select id="category-select" v-model="selectedCategory" aria-label="Kategorie filter"
              data-testid="stats-category">
              <option value="all">Alle Kategorien</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
            <label for="period-select" class="sr-only">Zeitraum</label>
            <select id="period-select" v-model.number="selectedPeriodDays" aria-label="Zeitraum"
              data-testid="stats-period">
              <option :value="0">Alle</option>
              <option :value="7">7 Tage</option>
              <option :value="30">30 Tage</option>
              <option :value="90">90 Tage</option>
            </select>
          </div>
        </div>
        <div class="chart-wrapper">
          <CategoryScoresChart v-if="!isEmpty" :scores="scores" title="Fähigkeiten je Kategorie (0–100)" />
          <div v-else class="card empty-card" aria-live="polite">
            <h3>Keine Daten für diesen Filter</h3>
            <p>Wähle einen anderen Zeitraum oder eine andere Kategorie, um Ergebnisse zu sehen.</p>
          </div>
        </div>

        <!-- Areas for improvement -->
        <div v-if="!isEmpty" class="improvement-section">
          <h2 class="label" style="margin:0 0 8px 0;">Verbesserungsbereiche</h2>
          <div class="grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
            <div class="card" data-testid="areas-below-target">
              <h3 style="margin-top:0;">Unter Ziel</h3>
              <ul style="margin:0; padding-left:16px;">
                <li v-for="d in areas.belowTarget" :key="d.id">
                  <router-link :to="{ name: 'DrillDetail', params: { id: d.id } }">{{ d.title || d.id }}</router-link>
                  <span class="muted" style="margin-left:8px;">(Lücke: {{ Math.round(d.gap || 0) }})</span>
                </li>
                <li v-if="areas.belowTarget.length === 0" class="muted">Keine</li>
              </ul>
            </div>

            <div class="card" data-testid="areas-stagnant">
              <h3 style="margin-top:0;">Stagnant</h3>
              <ul style="margin:0; padding-left:16px;">
                <li v-for="d in areas.stagnant" :key="d.id">
                  <router-link :to="{ name: 'DrillDetail', params: { id: d.id } }">{{ d.title || d.id }}</router-link>
                  <span class="muted" style="margin-left:8px;">(aktuell: {{ Math.round(d.latestLevel || 0) }})</span>
                </li>
                <li v-if="areas.stagnant.length === 0" class="muted">Keine</li>
              </ul>
            </div>

            <div class="card" data-testid="areas-most-improved">
              <h3 style="margin-top:0;">Meiste Verbesserung</h3>
              <ul style="margin:0; padding-left:16px;">
                <li v-for="i in areas.mostImproved.slice(0, 10)" :key="i.id">
                  <router-link :to="{ name: 'DrillDetail', params: { id: i.id } }">{{ i.title || i.id }}</router-link>
                  <span class="muted" style="margin-left:8px;">(Δ {{ (i.delta || 0).toFixed(2) }})</span>
                </li>
                <li v-if="areas.mostImproved.length === 0" class="muted">Keine</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card empty-card empty-card--full" aria-live="polite">
        <div class="empty-illustration" aria-hidden="true">📊</div>
        <h3>Keine Sessions bisher</h3>
        <p>Starte eine Trainingseinheit und speichere dein Ergebnis – dann füllen wir diese Übersicht automatisch.</p>
        <div class="empty-actions">
          <button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button>
          <router-link class="btn" :to="{ name: 'DrillsList' }">Alle Drills anzeigen</router-link>
        </div>
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import CategoryScoresChart from '@/components/CategoryScoresChart.vue'
import { computeAreasOfImprovement } from '@/stats/areas'
import { computeCategoryScores } from '@/stats/categoryScores'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { computed, onMounted, ref } from 'vue'

const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const ui = useUiStore()

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
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

const hasAnySessions = computed(() => (sessions.sessions?.length ?? 0) > 0)
const isEmpty = computed(() => (filteredSessions.value || []).length === 0)
const scores = computed(() => computeCategoryScores(filteredSessions.value, filteredDrills.value))

const rows = computed(() => {
  // Show categories alphabetically for stability
  const entries = Object.entries(scores.value || {})
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries.map(([category, value]) => ({ category, value: Math.max(0, Math.min(100, Number(value) || 0)) }))
})

const areas = computed(() => {
  // compute areas using currently filtered sessions/drills and the user's HCP
  try {
    return computeAreasOfImprovement(filteredSessions.value || [], filteredDrills.value || [], settings.hcp)
  } catch (e) {
    console.error('Error computing areas of improvement:', e)
    return { belowTarget: [], stagnant: [], mostImproved: [] }
  }
})
</script>

<style scoped>
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chart-wrapper {
  margin-top: 8px;
}

.improvement-section {
  margin-top: 16px;
}

.empty-card {
  text-align: center;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.empty-card--full {
  margin-top: 18px;
  justify-content: center;
}

.empty-illustration {
  font-size: 2.4rem;
}

.empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
