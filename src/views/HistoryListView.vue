<template>
  <section class="container" aria-labelledby="verlauf-title">
    <h1 id="verlauf-title" class="text-xl font-semibold">Fortschritt</h1>
    <ProgressTabs />

    <output v-if="!ready" class="p-4 flex items-center" aria-live="polite" :style="{ color: 'var(--muted)' }">Lädt…</output>

    <div v-else-if="sessions.sessions.length === 0" class="card empty-card" aria-live="polite" data-testid="history-empty">
      <h3>Noch keine Sessions</h3>
      <p>Speichere ein Ergebnis in einem Drill, dann erscheint es hier.</p>
      <div class="empty-actions">
        <button type="button" class="btn btn-primary" @click="ui.setShuffle(true)">Zufalls-Drill starten</button>
        <RouterLink class="btn" :to="{ name: 'DrillsList' }">Alle Drills anzeigen</RouterLink>
      </div>
    </div>

    <template v-else>
      <div class="filter-row">
        <label class="sr-only" for="hist-category">Kategorie</label>
        <select id="hist-category" v-model="category" class="input" data-testid="history-category">
          <option value="">Alle Kategorien</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <template v-if="focus.items.length">
          <label class="sr-only" for="hist-focus">Fokus</label>
          <select id="hist-focus" v-model="focusFilter" class="input" data-testid="history-focus-filter">
            <option value="">Alle Fokus-Punkte</option>
            <option value="none">Ohne Fokus</option>
            <option v-for="f in focus.list" :key="f.id" :value="f.id">{{ f.label }}</option>
          </select>
        </template>
        <label class="sr-only" for="hist-period">Zeitraum</label>
        <select id="hist-period" v-model.number="period" class="input" data-testid="history-period">
          <option :value="0">Alle</option>
          <option :value="7">7 Tage</option>
          <option :value="30">30 Tage</option>
          <option :value="90">90 Tage</option>
        </select>
      </div>

      <div class="chips" data-testid="history-summary" aria-live="polite">
        <span class="chip"><strong>{{ result.total }}</strong> {{ result.total === 1 ? 'Session' : 'Sessions' }}</span>
        <span class="chip"><strong>{{ result.drillCount }}</strong> {{ result.drillCount === 1 ? 'Drill' : 'verschiedene Drills' }}</span>
      </div>

      <div v-if="result.total === 0" class="card empty-card" aria-live="polite">
        <h3>Keine Sessions für diesen Filter</h3>
        <p>Wähle einen anderen Zeitraum oder eine andere Kategorie.</p>
        <div class="empty-actions"><button type="button" class="btn" @click="resetFilters">Filter zurücksetzen</button></div>
      </div>

      <div v-for="day in visibleDays" :key="day.key" class="hist-day" data-testid="history-day">
        <h2 class="hist-day-title">{{ formatDayLabel(day.key, now) }}</h2>
        <ul class="hist-list">
          <li v-for="e in day.entries" :key="e.session.id" class="card hist-item" data-testid="history-item">
            <div class="hist-main">
              <div class="hist-text">
                <RouterLink v-if="e.drill" class="hist-title" :to="{ name: 'DrillDetail', params: { id: e.drill.id } }">{{ e.drill.title }}</RouterLink>
                <span v-else class="hist-title">{{ e.session.drillId }}</span>
                <small class="muted">
                  {{ timeOf(e.session.date) }}<template v-if="e.drill"> - {{ e.drill.category }}</template><template v-if="typeof e.session.hcp === 'number'"> - HCP {{ String(e.session.hcp).replace('.', ',') }}</template>
                </small>
              </div>
              <div class="hist-result">
                <strong>{{ e.session.result.value }}</strong>
                <small class="muted">{{ e.session.result.unit }}</small>
              </div>
            </div>
            <div class="chips">
              <LevelStars v-if="e.level != null" :level="e.level" compact />
              <span v-if="e.isPb" class="chip chip-pb" data-testid="pb-chip">PB</span>
              <span v-if="e.session.focusId && focus.byId(e.session.focusId)" class="chip" data-testid="focus-chip">Fokus: {{ focus.byId(e.session.focusId)!.label }}</span>
              <span v-if="e.session.attempts != null" class="chip">{{ e.session.attempts }} Versuche</span>
              <template v-if="focus.items.length">
                <label class="sr-only" :for="`focus-${e.session.id}`">Fokus zuordnen</label>
                <select :id="`focus-${e.session.id}`" class="input hist-focus-select" :value="e.session.focusId ?? ''" data-testid="history-assign-focus"
                  @change="assignFocus(e.session.id, ($event.target as HTMLSelectElement).value)">
                  <option value="">Kein Fokus</option>
                  <option v-for="f in focus.list" :key="f.id" :value="f.id">{{ f.label }}</option>
                </select>
              </template>
              <button type="button" class="btn hist-delete" :aria-label="`Session vom ${dateTimeLabel(e.session.date)} löschen`" data-testid="history-delete" @click="remove(e.session.id)">Löschen</button>
            </div>
            <p v-if="e.session.notes" class="hist-notes">{{ e.session.notes }}</p>
          </li>
        </ul>
      </div>

      <div v-if="shown < result.total" class="more-row">
        <button type="button" class="btn" data-testid="history-more" @click="limit += PAGE">Mehr anzeigen ({{ result.total - shown }})</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import LevelStars from '@/components/LevelStars.vue'
import ProgressTabs from '@/components/ProgressTabs.vue'
import { evaluateSessionLevel } from '@/hcp/evaluator'
import { buildHistory, formatDayLabel, limitHistory } from '@/history/entries'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFocusStore } from '@/stores/focus'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { requestConfirm } from '@/utils/confirmService'
import { computed, onMounted, ref, watch } from 'vue'

const PAGE = 30
const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()
const focus = useFocusStore()
const settings = useSettingsStore()
const ui = useUiStore()

const now = new Date()
const category = ref('')
const period = ref(0)
const focusFilter = ref('')
const limit = ref(PAGE)

onMounted(async () => {
  await Promise.all([
    catalog.loaded ? null : catalog.load(),
    sessions.loaded ? null : sessions.load(),
    settings.loaded ? null : settings.load(),
    focus.loaded ? null : focus.load(),
  ])
})

watch([category, period, focusFilter], () => { limit.value = PAGE })

const ready = computed(() => catalog.loaded && sessions.loaded)
const categories = computed(() => Array.from(new Set(catalog.drills.map(d => d.category))).sort((a, b) => a.localeCompare(b, 'de')))

const result = computed(() => buildHistory(sessions.sessions, catalog.drills, {
  category: category.value || undefined,
  focusId: focusFilter.value || undefined,
  days: period.value,
  now,
  levelOf: (s, d) => evaluateSessionLevel(s, d, 'historical'),
}))
const visibleDays = computed(() => limitHistory(result.value, limit.value))
const shown = computed(() => visibleDays.value.reduce((n, d) => n + d.entries.length, 0))

const timeOf = (iso: string) => new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
const dateTimeLabel = (iso: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

function resetFilters() {
  category.value = ''
  focusFilter.value = ''
  period.value = 0
}

async function assignFocus(sessionId: string, focusId: string) {
  await sessions.setFocus(sessionId, focusId || null)
}

async function remove(id: string) {
  if (await requestConfirm('Diese Session wirklich löschen?')) await sessions.remove(id)
}
</script>

<style scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.hist-day {
  margin-top: 14px;
}

.hist-day-title {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--muted);
}

.hist-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hist-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  margin: 0;
}

.hist-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.hist-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hist-title {
  font-weight: 600;
  color: var(--text);
}

.hist-result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  max-width: 45%;
}

.hist-notes {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.hist-focus-select {
  width: auto;
  max-width: 11rem;
  font-size: 0.85rem;
  padding: 2px 8px;
}

.hist-delete {
  margin-left: auto;
  font-size: 0.85rem;
  padding: 2px 10px;
}

.chip-pb {
  background: color-mix(in oklab, var(--primary) 15%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.more-row {
  display: flex;
  justify-content: center;
  margin: 14px 0 6px;
}

.empty-card {
  text-align: center;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.empty-card h3 {
  margin: 0;
  font-size: 1rem;
}

.empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
