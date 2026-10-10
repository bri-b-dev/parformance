<template>
  <section class="container today" aria-labelledby="today-title">
    <h1 id="today-title" class="text-xl font-semibold">Heute</h1>
    <HcpHint />

    <output v-if="!ready" class="p-4 flex items-center" aria-live="polite" :style="{ color: 'var(--muted)' }">
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

      <!-- Time budget -->
      <div class="card today-card" data-testid="today-budget">
        <h2 class="today-h">Wie viel Zeit hast du?</h2>
        <div class="today-actions" role="group" aria-label="Zeitbudget">
          <button v-for="m in budgets" :key="m" type="button" class="btn" :class="{ 'btn-primary': budget === m }"
            :aria-pressed="budget === m" @click="budget = budget === m ? null : m">{{ m }} min</button>
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
            <RouterLink class="btn btn-primary" :to="{ name: 'DrillDetail', params: { id: plan.items[0].drill.id } }">Mit dem ersten Drill starten</RouterLink>
          </div>
          <p v-else class="muted">In dieser Zeit passt kein Drill - wähle ein längeres Zeitfenster.</p>
        </template>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import HcpHint from '@/components/HcpHint.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { computeAreasOfImprovement } from '@/stats/areas'
import { computeCategoryScores } from '@/stats/categoryScores'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { planSession, suggestDrills, type SuggestContext } from '@/today/suggest'
import { computeActiveStreak, sessionsThisWeek } from '@/utils/streaks'
import { computed, onMounted, ref } from 'vue'

const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const favorites = useFavoritesStore()
const ui = useUiStore()
const { hcp: currentHcp } = useCurrentHcp()

const now = new Date()
const budgets = [15, 30, 60]
const budget = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([
    catalog.loaded ? null : catalog.load(),
    sessions.loaded ? null : sessions.load(),
    settings.loaded ? null : settings.load(),
    favorites.loaded ? null : favorites.load(),
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
  }
})

const suggestions = computed(() => suggestDrills(ctx.value, 3))
const plan = computed(() => (budget.value ? planSession(ctx.value, budget.value) : null))

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

.today-reason {
  margin: 2px 0 0;
  font-size: 0.9rem;
}
</style>
