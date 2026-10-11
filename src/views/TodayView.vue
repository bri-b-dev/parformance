<template>
  <section class="container today" aria-labelledby="today-title">
    <h1 id="today-title" class="text-xl font-semibold">Heute</h1>
    <HcpHint />

    <output v-if="!ready" class="p-4 flex items-center muted" aria-live="polite">
      Lädt…
    </output>

    <template v-else>
      <!-- Streak and week -->
      <div class="today-stats" data-testid="today-stats">
        <div class="chip">
          <strong>{{ streak.current }}</strong> {{ streak.current === 1 ? 'Tag' : 'Tage' }} in Folge
          <span v-if="streak.current > 0 && !streak.practicedToday" class="muted"> - heute üben hält die Serie</span>
        </div>
        <div class="chip"><strong>{{ weekCount }}</strong> {{ weekCount === 1 ? 'Session' : 'Sessions' }} diese Woche</div>
      </div>

      <FocusCard />

      <!-- Resume a running session -->
      <div v-if="run.run && !run.finished" class="card today-card" data-testid="today-resume">
        <h2 class="today-h">Einheit läuft</h2>
        <p class="today-title">{{ run.run.title }}</p>
        <p class="muted">Drill {{ run.run.index + 1 }} von {{ run.total }}</p>
        <div class="today-actions">
          <RouterLink class="btn btn-primary" :to="{ name: 'Run' }">Fortsetzen</RouterLink>
          <button type="button" class="btn" data-testid="today-discard" @click="discardRun">Verwerfen</button>
        </div>
      </div>

      <!-- First run -->
      <div v-if="sessions.sessions.length === 0" class="card today-card" data-testid="today-empty">
        <h2 class="today-h">Starte deine erste Einheit</h2>
        <p class="muted">Such dir einen Drill aus oder lass die App würfeln. Danach siehst du hier, was dir als Nächstes am meisten bringt.</p>
        <div class="today-actions">
          <button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button>
          <RouterLink class="btn" :to="{ name: 'DrillsList' }">Alle Drills anzeigen</RouterLink>
        </div>
      </div>

      <!-- Continue -->
      <div v-else-if="lastDrill" class="card today-card" data-testid="today-continue">
        <h2 class="today-h">Weiter üben</h2>
        <p class="today-title">{{ lastDrill.drill.title }} <span class="chip">{{ lastDrill.drill.category }}</span></p>
        <p class="muted">
          Zuletzt {{ lastDrill.daysAgo === 0 ? 'heute' : lastDrill.daysAgo === 1 ? 'gestern' : `vor ${lastDrill.daysAgo} Tagen` }}:
          {{ lastDrill.session.result.value }} {{ lastDrill.drill.metric.unit }}
        </p>
        <div class="today-actions">
          <RouterLink class="btn btn-primary" :to="{ name: 'DrillDetail', params: { id: lastDrill.drill.id } }">Nochmal</RouterLink>
        </div>
      </div>

      <!-- Suggestions -->
      <div class="card today-card" data-testid="today-suggestions">
        <h2 class="today-h">Heute für dich</h2>
        <ul class="today-list">
          <li v-for="s in suggestions" :key="s.drill.id" class="today-item">
            <div class="today-item-main">
              <RouterLink class="today-title" :to="{ name: 'DrillDetail', params: { id: s.drill.id } }">{{ s.drill.title }}</RouterLink>
              <span class="chip">{{ s.drill.category }}</span>
              <span class="chip">{{ s.minutes }} min</span>
            </div>
            <p class="muted today-reason">{{ s.reason }}</p>
          </li>
        </ul>
      </div>

      <!-- Collections -->
      <div class="card today-card" data-testid="today-collections">
        <h2 class="today-h">Meine Sammlungen</h2>
        <ul v-if="collections.items.length" class="today-list">
          <li v-for="c in collections.items" :key="c.id" class="today-item today-collection">
            <span class="today-title"><CollectionIcon :icon="c.icon" /> {{ c.name }}</span>
            <button type="button" class="btn" :aria-label="`${c.name} starten`" data-testid="today-collection-start" @click="startCollection(c)">Starten</button>
          </li>
        </ul>
        <p v-else class="muted">Stelle eigene Einheiten zusammen, z. B. „Vor der Runde 20 min".</p>
        <div class="today-actions">
          <RouterLink class="btn" :to="{ name: 'Collections' }">{{ collections.items.length ? 'Verwalten' : 'Sammlung anlegen' }}</RouterLink>
        </div>
      </div>

      <!-- Time budget -->
      <div class="card today-card" data-testid="today-budget">
        <h2 class="today-h">Wie viel Zeit hast du?</h2>
        <div class="today-actions" role="group" aria-label="Zeitbudget">
          <button v-for="m in budgets" :key="m" type="button" class="btn" :class="{ 'btn-primary': budget === m }"
            :aria-pressed="budget === m" @click="budget = budget === m ? null : m">{{ m }} min</button>
        </div>
        <div class="today-actions" role="group" aria-label="Ort" data-testid="today-locations">
          <button v-for="g in locations" :key="g" type="button" class="chip today-chip" :class="{ 'today-chip-on': location === g }"
            :aria-pressed="location === g" @click="location = location === g ? null : g">{{ g }}</button>
        </div>
        <template v-if="plan">
          <p class="muted" data-testid="plan-total">{{ plan.items.length }} {{ plan.items.length === 1 ? 'Drill' : 'Drills' }}, zusammen {{ plan.totalMinutes }} von {{ plan.budget }} Minuten</p>
          <ol class="today-list">
            <li v-for="s in plan.items" :key="s.drill.id" class="today-item">
              <div class="today-item-main">
                <RouterLink class="today-title" :to="{ name: 'DrillDetail', params: { id: s.drill.id } }">{{ s.drill.title }}</RouterLink>
                <span class="chip">{{ s.minutes }} min</span>
              </div>
              <p class="muted today-reason">{{ s.reason }}</p>
            </li>
          </ol>
          <div v-if="plan.items.length" class="today-actions">
            <button type="button" class="btn btn-primary" data-testid="plan-start" @click="startPlan">Einheit starten ({{ plan.items.length }} {{ plan.items.length === 1 ? 'Drill' : 'Drills' }})</button>
          </div>
          <p v-else class="muted">In dieser Zeit passt kein Drill - wähle ein längeres Zeitfenster.</p>
        </template>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import CollectionIcon from '@/components/CollectionIcon.vue'
import FocusCard from '@/components/FocusCard.vue'
import HcpHint from '@/components/HcpHint.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { computeAreasOfImprovement } from '@/stats/areas'
import { computeCategoryScores } from '@/stats/categoryScores'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useCollectionsStore, type Collection } from '@/stores/collections'
import { useFocusStore } from '@/stores/focus'
import { useRunStore } from '@/stores/run'
import { useStartRun } from '@/composables/useStartRun'
import { LOCATION_GROUPS, locationGroup } from '@/filters/location'
import { requestConfirm } from '@/utils/confirmService'
import { useUiStore } from '@/stores/ui'
import { planSession, suggestDrills, type SuggestContext } from '@/today/suggest'
import { computeActiveStreak, sessionsThisWeek } from '@/utils/streaks'
import { computed, onMounted, ref } from 'vue'

const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const favorites = useFavoritesStore()
const ui = useUiStore()
const collections = useCollectionsStore()
const focusStore = useFocusStore()
const run = useRunStore()
const startRun = useStartRun()
const { hcp: currentHcp } = useCurrentHcp()

const now = new Date()
const budgets = [15, 30, 60]
const budget = ref<number | null>(null)
const location = ref<string | null>(null)
const locations = LOCATION_GROUPS

onMounted(async () => {
  await Promise.all([
    catalog.loaded ? null : catalog.load(),
    sessions.loaded ? null : sessions.load(),
    settings.loaded ? null : settings.load(),
    favorites.loaded ? null : favorites.load(),
    collections.loaded ? null : collections.load(),
    focusStore.loaded ? null : focusStore.load(),
    run.loaded ? null : run.load(),
  ])
})

const ready = computed(() => catalog.loaded && sessions.loaded && settings.loaded)

const streak = computed(() => computeActiveStreak(sessions.sessions, now))
const weekCount = computed(() => sessionsThisWeek(sessions.sessions, now))

const ctx = computed<SuggestContext>(() => {
  const areas = computeAreasOfImprovement(sessions.sessions, catalog.drills, currentHcp.value, { mode: 'current', targetHcp: settings.targetHcp })
  return {
    drills: catalog.drills,
    sessions: sessions.sessions,
    now,
    belowTarget: areas.belowTarget,
    categoryScores: computeCategoryScores(sessions.sessions, catalog.drills, 'current'),
    targetHcp: settings.targetHcp,
    favorites: favorites.list,
    focus: focusFor(),
  }
})

function focusFor(): SuggestContext['focus'] {
  const f = focusStore.active
  if (!f) return null
  const c = f.collectionId ? collections.byId(f.collectionId) : undefined
  return c ? { label: f.label, drillIds: c.drillIds } : null
}

const suggestions = computed(() => suggestDrills(ctx.value, 3))
const plan = computed(() => {
  if (!budget.value) return null
  const c = location.value ? { ...ctx.value, drills: ctx.value.drills.filter(d => locationGroup(d) === location.value) } : ctx.value
  return planSession(c, budget.value)
})

function startPlan() {
  if (!plan.value?.items.length) return
  const where = location.value ? `, ${location.value}` : ''
  return startRun({ title: `${plan.value.budget}-Minuten-Einheit${where}`, drillIds: plan.value.items.map(s => s.drill.id) })
}

function startCollection(c: Collection) {
  const ids = c.drillIds.filter(id => catalog.drills.some(d => d.id === id))
  return startRun({ title: c.name, drillIds: ids, collectionId: c.id })
}

async function discardRun() {
  if (await requestConfirm('Laufende Einheit verwerfen?')) run.clear()
}

const lastDrill = computed(() => {
  const s = [...sessions.sessions].sort((a, b) => b.date.localeCompare(a.date))[0]
  const drill = s && catalog.drills.find(d => d.id === s.drillId)
  if (!s || !drill) return null
  const daysAgo = Math.max(0, Math.floor((now.getTime() - new Date(s.date).getTime()) / 86_400_000))
  return { session: s, drill, daysAgo }
})
</script>

<style scoped>
.today {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.today-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.today-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.today-h {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.today-title {
  font-weight: 600;
  color: var(--text);
}

.today-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.today-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

ol.today-list {
  counter-reset: step;
}

.today-item-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.today-collection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.today-chip {
  cursor: pointer;
}

.today-chip-on {
  background: color-mix(in oklab, var(--primary) 15%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.today-reason {
  margin: 2px 0 0;
  font-size: 0.9rem;
}
</style>
