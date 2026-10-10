<template>
  <section class="container">
    <h1 class="text-xl font-semibold">Fortschritt</h1>
    <ProgressTabs />
    <HcpHint />

    <!-- Loading state -->
    <output v-if="!drillsLoaded || !sessionsLoaded" class="p-4 flex items-center text-sm text-gray-600" aria-live="polite">
      <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-hidden="true"></span>
      Lädt…
    </output>

    <!-- Content -->
    <div v-else>
      <div v-if="hasAnySessions" class="stats-content">
        <!-- Filters -->
        <div class="filters">
          <SegmentedControl v-model="period" :options="PERIOD_OPTIONS" label="Zeitraum" testid="period" />
          <SegmentedControl v-model="evaluationMode" :options="EVAL_OPTIONS" label="Auswertung" describedby="eval-help" testid="eval" />
        </div>
        <p id="eval-help" class="muted eval-help" data-testid="eval-help">
          <template v-if="evaluationMode === 'current'"><strong>Aktuell:</strong> alle Ergebnisse werden mit deinem heutigen Handicap bewertet.</template>
          <template v-else><strong>Historisch:</strong> jede Session zählt mit dem Handicap, das damals galt.</template>
        </p>
        <div class="chip-row" role="group" aria-label="Kategorie" data-testid="stats-category">
          <button type="button" class="chip fchip" :class="{ on: category === '' }" :aria-pressed="category === ''" @click="category = ''">Alle</button>
          <button v-for="c in categories" :key="c" type="button" class="chip fchip" :class="{ on: category === c }" :aria-pressed="category === c" @click="category = category === c ? '' : c">{{ c }}</button>
        </div>

        <!-- Goal -->
        <section v-if="goal" class="card goal-card" data-testid="goal-card" aria-live="polite">
          <h2 class="label" style="margin:0;">Ziel: HCP {{ settings.targetHcp }}</h2>
          <p class="goal-line">
            <template v-if="settings.targetDate">
              bis {{ formatGoalDate(settings.targetDate) }} -
              <strong v-if="goal.overdue">Zieldatum überschritten</strong>
              <strong v-else-if="goal.daysLeft === 0">heute</strong>
              <strong v-else>noch {{ goal.weeksLeft }} {{ goal.weeksLeft === 1 ? 'Woche' : 'Wochen' }}</strong>
            </template>
            <template v-else>Kein Zieldatum gesetzt</template>
          </p>
          <p v-if="currentHcp != null" class="goal-line" data-testid="goal-current">
            Aktuell <strong>{{ formatHcp(currentHcp) }}</strong>
            <template v-if="strokesToGoal != null && strokesToGoal > 0">- noch {{ String(strokesToGoal).replace('.', ',') }} Schläge bis zum Ziel</template>
            <template v-else-if="strokesToGoal != null">- Ziel erreicht</template>
            <span v-if="fromRounds" class="muted"> (aus deinen Runden)</span>
          </p>
          <p v-if="areas.evaluatedForTarget > 0" class="goal-line">
            Zielniveau erreicht in <strong>{{ areas.evaluatedForTarget - areas.belowTarget.length }}</strong>
            von {{ areas.evaluatedForTarget }} geübten Drills
          </p>
          <div v-if="areas.evaluatedForTarget > 0" class="goal-bar" role="progressbar" :aria-valuenow="goalPct" aria-valuemin="0" aria-valuemax="100" aria-label="Fortschritt zum Ziel">
            <div class="goal-bar-fill" :style="{ width: goalPct + '%' }"></div>
          </div>
        </section>

        <!-- Nothing in this filter -->
        <div v-if="isEmpty" class="card empty-card" aria-live="polite" data-testid="stats-filter-empty">
          <h3>Keine Sessions für diesen Filter</h3>
          <p>In diesem Zeitraum{{ category ? ` und dieser Kategorie` : '' }} gibt es nichts auszuwerten. Zeig mehr oder übe jetzt etwas.</p>
          <div class="empty-actions">
            <button v-if="period !== 0" type="button" class="btn" data-testid="stats-show-all" @click="period = 0">Alle Zeiträume zeigen</button>
            <button v-if="category" type="button" class="btn" @click="category = ''">Alle Kategorien</button>
            <button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button>
          </div>
        </div>

        <template v-else>
          <!-- Key figures -->
          <section class="kpis" aria-label="Kennzahlen" data-testid="kpis">
            <div class="card kpi" data-testid="kpi-sessions">
              <p class="kpi-label">Sessions</p>
              <p class="kpi-value">{{ kpis.sessions }}</p>
              <p class="muted kpi-sub">{{ perWeekText }} · {{ kpis.drills }} {{ kpis.drills === 1 ? 'Drill' : 'Drills' }}</p>
            </div>
            <div class="card kpi" data-testid="kpi-minutes">
              <p class="kpi-label">Trainingszeit</p>
              <p class="kpi-value">{{ kpis.minutes }} <small>Min.</small></p>
              <p class="muted kpi-sub">{{ kpis.minutesEstimated ? 'geschätzt, wo kein Timer lief' : 'laut Timer' }}</p>
            </div>
            <div class="card kpi" data-testid="kpi-pbs">
              <p class="kpi-label">Neue Bestwerte</p>
              <p class="kpi-value">{{ kpis.pbs }}</p>
              <p class="muted kpi-sub">in diesem Zeitraum</p>
            </div>
            <div class="card kpi" data-testid="kpi-hcp">
              <p class="kpi-label">Handicap</p>
              <template v-if="currentHcp != null">
                <p class="kpi-value">{{ formatHcp(currentHcp) }}</p>
                <p class="muted kpi-sub">{{ hcpDeltaText }}</p>
                <Sparkline v-if="hcpSeries.length > 1" :data="hcpSeries" :width="120" :height="24" color="var(--primary)" />
              </template>
              <template v-else>
                <p class="kpi-value">-</p>
                <button type="button" class="btn" @click="ui.setSettings(true)">Handicap eintragen</button>
              </template>
            </div>
          </section>

          <!-- Skills -->
          <section aria-labelledby="skills-title">
            <h2 id="skills-title" class="label">Fähigkeiten je Kategorie</h2>
            <CategoryScoresChart :scores="scores" title="Fähigkeiten je Kategorie (0-100)" />
            <div class="card trend-card">
              <CategoryTrendTable :rows="rows" />
              <p v-if="period === 0" class="muted trend-note" data-testid="trend-note">Wähle 7, 30 oder 90 Tage, um die Veränderung zum Zeitraum davor zu sehen.</p>
            </div>
          </section>

          <!-- Next -->
          <section aria-labelledby="next-title" data-testid="next-steps">
            <h2 id="next-title" class="label">Als Nächstes</h2>
            <ul v-if="steps.length" class="steps">
              <li v-for="s in steps" :key="s.drillId" class="card step" data-testid="next-step">
                <p class="step-text">{{ s.text }}</p>
                <div class="step-actions">
                  <button v-if="s.kind !== 'stagnant'" type="button" class="btn btn-primary" :aria-label="`${s.title} starten`" data-testid="step-start" @click="startStep(s.drillId, true)">Drill starten</button>
                  <button type="button" class="btn" :aria-label="`${s.title}: Details`" data-testid="step-details" @click="startStep(s.drillId, false)">Details</button>
                </div>
              </li>
            </ul>
            <div v-else class="card empty-card" data-testid="next-empty">
              <template v-if="currentHcp == null && settings.targetHcp == null">
                <h3>Dein Handicap fehlt</h3>
                <p>Trage es ein, dann zeigen wir dir, wo du am meisten gewinnst.</p>
                <div class="empty-actions"><button type="button" class="btn btn-primary" @click="ui.setSettings(true)">Handicap eintragen</button></div>
              </template>
              <template v-else>
                <h3>Alles im grünen Bereich</h3>
                <p>Bei den geübten Drills fehlt nichts. Probier als Nächstes etwas Neues.</p>
                <div class="empty-actions"><button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button></div>
              </template>
            </div>
          </section>

          <section v-if="better.length" aria-labelledby="good-title" data-testid="improved">
            <h2 id="good-title" class="label">Läuft gut</h2>
            <ul class="steps">
              <li v-for="i in better" :key="i.drillId" class="card step">
                <p class="step-text">{{ i.text }}</p>
                <div class="step-actions">
                  <button type="button" class="btn" :aria-label="`${i.title}: Details`" @click="startStep(i.drillId, false)">Details</button>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </div>

      <div v-else class="card empty-card empty-card--full" aria-live="polite">
        <div class="empty-illustration" aria-hidden="true">📊</div>
        <h3>Keine Sessions bisher</h3>
        <p>Starte eine Trainingseinheit und speichere dein Ergebnis - dann füllen wir diese Übersicht automatisch.</p>
        <div class="empty-actions">
          <button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button>
          <router-link class="btn" :to="preserve({ name: 'DrillsList' })">Alle Drills anzeigen</router-link>
        </div>
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import CategoryScoresChart from '@/components/CategoryScoresChart.vue'
import CategoryTrendTable from '@/components/CategoryTrendTable.vue'
import HcpHint from '@/components/HcpHint.vue'
import ProgressTabs from '@/components/ProgressTabs.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import Sparkline from '@/components/Sparkline.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { formatHcp } from '@/hcp/format'
import { useHcpSource } from '@/hcp/source'
import { withPreservedQuery } from '@/router'
import { computeAreasOfImprovement } from '@/stats/areas'
import { computeGoalProgress, formatGoalDate } from '@/stats/goal'
import { categoryRows, computeKpis, filterSessions, improvements, nextSteps, PERIOD_OPTIONS } from '@/stats/progress'
import { fmtNumber } from '@/session/summary'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const preserve = (to: any) => withPreservedQuery(to, route)

const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const { hcp: currentHcp, fromRounds } = useCurrentHcp()
const ui = useUiStore()

const EVAL_OPTIONS = [
  { value: 'current' as const, label: 'Aktuell' },
  { value: 'historical' as const, label: 'Historisch' },
]

// 30 days gives a useful comparison with the 30 before; falls back to "Alles" if nothing happened lately
const period = ref<number>(30)
const category = ref('')
const evaluationMode = ref<'historical' | 'current'>('current')

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
  const cutoff = Date.now() - 30 * 86_400_000
  if (sessions.sessions.length > 0 && !sessions.sessions.some(s => Date.parse(s.date) >= cutoff)) period.value = 0
})

const drillsLoaded = computed(() => catalog.loaded)
const sessionsLoaded = computed(() => sessions.loaded)

const categories = computed(() => Array.from(new Set(catalog.drills.map(d => d.category))).sort((a, b) => a.localeCompare(b, 'de')))
const filteredDrills = computed(() => (category.value ? catalog.drills.filter(d => d.category === category.value) : catalog.drills))

const filteredSessions = computed(() => filterSessions(sessions.sessions, catalog.drills, { days: period.value, category: category.value || undefined }))
// all sessions of the selected category: the previous period is needed for the trend
const categorySessions = computed(() => filterSessions(sessions.sessions, catalog.drills, { days: 0, category: category.value || undefined }))

const hasAnySessions = computed(() => sessions.sessions.length > 0)
const isEmpty = computed(() => filteredSessions.value.length === 0)

const kpis = computed(() => computeKpis({ periodSessions: filteredSessions.value, allSessions: sessions.sessions, drills: catalog.drills, days: period.value }))
const perWeekText = computed(() => (kpis.value.perWeek === null ? '' : `Ø ${fmtNumber(kpis.value.perWeek)} pro Woche`))

const rows = computed(() => categoryRows({ sessions: categorySessions.value, drills: filteredDrills.value, days: period.value, mode: evaluationMode.value }))
const scores = computed(() => Object.fromEntries(rows.value.map(r => [r.category, r.score])))

const areas = computed(() => {
  try {
    return computeAreasOfImprovement(filteredSessions.value, filteredDrills.value, currentHcp.value, { mode: evaluationMode.value, targetHcp: settings.targetHcp })
  } catch (e) {
    console.error('Error computing areas of improvement:', e)
    return { belowTarget: [], stagnant: [], mostImproved: [], evaluatedForTarget: 0 }
  }
})
const steps = computed(() => nextSteps(areas.value, catalog.drills, { targetHcp: settings.targetHcp }))
const better = computed(() => improvements(areas.value, catalog.drills))

const goal = computed(() => (settings.targetHcp == null ? null : (computeGoalProgress(settings.targetDate) ?? { daysLeft: 0, weeksLeft: 0, overdue: false })))
const goalPct = computed(() => (areas.value.evaluatedForTarget
  ? Math.round(((areas.value.evaluatedForTarget - areas.value.belowTarget.length) / areas.value.evaluatedForTarget) * 100)
  : 0))
const strokesToGoal = computed(() => (currentHcp.value != null && settings.targetHcp != null ? Math.round((currentHcp.value - settings.targetHcp) * 10) / 10 : null))

const hcpSeries = computed(() => (useHcpSource().getSeries?.() ?? []).slice(-20).map(p => p.hcp))
const hcpDeltaText = computed(() => {
  const src = useHcpSource()
  const now = currentHcp.value
  if (now === null) return ''
  const from = period.value > 0 ? new Date(Date.now() - period.value * 86_400_000) : null
  const before = from ? src.getHcpAt(from) : (src.getSeries?.()[0]?.hcp ?? null)
  if (before === null) return 'noch kein Vergleich'
  const d = Math.round((now - before) * 10) / 10
  const span = period.value > 0 ? `vor ${period.value} Tagen` : 'am Anfang'
  if (d === 0) return `unverändert ggü. ${span}`
  return `${d < 0 ? '−' : '+'}${String(Math.abs(d)).replace('.', ',')} ggü. ${span}`
})

async function startStep(drillId: string, start: boolean) {
  if (start) ui.requestStart(drillId)
  await router.push(preserve({ name: 'DrillDetail', params: { id: drillId } }))
}
</script>

<style scoped>
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.eval-help {
  margin: 0;
  font-size: 0.9rem;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fchip {
  cursor: pointer;
  min-height: 32px;
}

.fchip.on {
  background: color-mix(in oklab, var(--primary) 16%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.goal-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
}

.goal-line {
  margin: 0;
  font-size: 0.95rem;
}

.goal-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.goal-bar-fill {
  height: 100%;
  background: var(--primary);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.kpi {
  margin: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi p {
  margin: 0;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.1;
}

.kpi-value small {
  font-size: 0.9rem;
  font-weight: 600;
}

.kpi-sub {
  font-size: 0.85rem;
}

.trend-card {
  margin-top: 10px;
  padding: 8px 10px;
}

.trend-note {
  margin: 8px 0 0;
  font-size: 0.85rem;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step {
  margin: 0;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-text {
  margin: 0;
}

.step-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
