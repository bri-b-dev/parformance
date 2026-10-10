<template>
  <div class="overlay" data-testid="shuffle-overlay" @click.self="close">
    <div ref="panel" class="card overlay-panel" role="dialog" aria-modal="true" aria-labelledby="shuffle-title" @keydown.esc.stop="close" @keydown.tab="trapTab">
      <header class="shuffle-head">
        <h2 id="shuffle-title" class="shuffle-title">Zufalls-Drill</h2>
        <button type="button" class="btn shuffle-close" aria-label="Schließen" data-testid="shuffle-close" @click="close">✕</button>
      </header>

      <output v-if="!catalog.loaded" class="shuffle-loading" aria-live="polite">Lädt…</output>
      <output v-else-if="catalog.error" class="shuffle-error" aria-live="polite">{{ catalog.error }}</output>

      <div v-else class="shuffle-body">
        <!-- Filters -->
        <section class="shuffle-filters" aria-label="Filter">
          <div class="chip-row" role="group" aria-label="Kategorie">
            <button type="button" class="chip fchip" :class="{ on: category === '' }" :aria-pressed="category === ''" @click="category = ''">Alle</button>
            <button v-for="c in categories" :key="c" type="button" class="chip fchip" :class="{ on: category === c }" :aria-pressed="category === c" @click="category = category === c ? '' : c">{{ c }}</button>
          </div>
          <div class="chip-row" role="group" aria-label="Ort">
            <button v-for="g in LOCATION_GROUPS" :key="g" type="button" class="chip fchip" :class="{ on: place === g }" :aria-pressed="place === g" @click="place = place === g ? '' : g">{{ g }}</button>
          </div>
          <div class="chip-row" role="group" aria-label="Dauer">
            <button v-for="d in DURATIONS" :key="d.max" type="button" class="chip fchip" :class="{ on: maxMinutes === d.max }" :aria-pressed="maxMinutes === d.max" @click="maxMinutes = maxMinutes === d.max ? 0 : d.max">{{ d.label }}</button>
          </div>
          <div v-if="ui.activeTag" class="chip-row">
            <button type="button" class="chip fchip on" :aria-label="`Tag-Filter ${ui.activeTag} entfernen`" @click="ui.setActiveTag('')">Tag: {{ ui.activeTag }} ✕</button>
          </div>

          <label class="fav-switch">
            <input v-model="biasFavorites" type="checkbox" role="switch" :disabled="!hasAnyFavorites" data-testid="bias-favorites" />
            <span>
              <strong>Favoriten bevorzugen</strong>
              <small class="muted">{{ hasAnyFavorites ? 'Deine Favoriten werden deutlich häufiger gezogen.' : 'Markiere Drills mit ☆ als Favorit, um sie zu bevorzugen.' }}</small>
            </span>
          </label>
          <p class="muted pool-count" data-testid="pool-count">{{ pool.length }} {{ pool.length === 1 ? 'Drill' : 'Drills' }} im Pool</p>
        </section>

        <!-- Reel -->
        <Reel ref="reel" :items="nameItems" label="Zufalls-Drill" :spin-trigger="spinTick" :duration="SPIN_MS" :target-value="target?.title" @stopped="onStopped" />

        <p class="sr-only" aria-live="polite" data-testid="shuffle-announce">{{ announce }}</p>

        <!-- Empty pool -->
        <div v-if="pool.length === 0" class="shuffle-empty" data-testid="shuffle-empty">
          <p>Für diese Filter gibt es keine Drills.</p>
          <button type="button" class="btn" @click="resetFilters">Filter zurücksetzen</button>
        </div>

        <!-- Result -->
        <section v-else-if="result && !spinning" class="card result" data-testid="shuffle-result" aria-labelledby="result-title">
          <h3 id="result-title" class="result-title">{{ result.title }}</h3>
          <div class="chip-row">
            <span class="chip">{{ result.category }}</span>
            <span class="chip" data-testid="result-minutes">{{ drillMinutes(result) }} Min.</span>
            <span v-if="difficulty" class="chip" :aria-label="`Schwierigkeit ${difficulty} von 5`" data-testid="result-difficulty">{{ '●'.repeat(difficulty) }}{{ '○'.repeat(5 - difficulty) }}</span>
            <span v-if="favorites.isFavorite(result.id)" class="chip">★ Favorit</span>
          </div>
          <p v-if="result.summary" class="muted">{{ result.summary }}</p>
          <p class="result-target" data-testid="result-target">{{ targetText }}</p>
          <div class="result-actions">
            <button type="button" class="btn btn-primary" data-testid="shuffle-start" @click="start">Starten</button>
            <button type="button" class="btn" data-testid="shuffle-again" :disabled="spinning" @click="spin">Nochmal</button>
            <button type="button" class="btn" data-testid="shuffle-details" @click="details">Details</button>
          </div>
        </section>

        <!-- Spin -->
        <div v-else class="spin-actions">
          <button v-if="!spinning" type="button" class="btn btn-primary spin-btn" data-testid="shuffle-spin" :disabled="pool.length === 0" @click="spin">Drehen</button>
          <button v-else type="button" class="btn" data-testid="shuffle-skip" @click="skip">Überspringen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Reel from '@/components/Reel.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { LOCATION_GROUPS, locationGroup } from '@/filters/location'
import { formatHcp } from '@/hcp/format'
import { resolveThresholds } from '@/hcp/buckets'
import { valueForLevel } from '@/hcp/level'
import { pickRandomDrill } from '@/shuffle/pick'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { withPreservedQuery } from '@/router'
import { drillMinutes } from '@/today/suggest'
import type { Drill } from '@/types'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const SPIN_MS = 1000
const RECENT_SESSIONS = 5
const DURATIONS = [
  { max: 10, label: 'bis 10 Min.' },
  { max: 20, label: 'bis 20 Min.' },
  { max: 30, label: 'bis 30 Min.' },
]

const catalog = useDrillCatalogStore()
const favorites = useFavoritesStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()
const { hcp: currentHcp } = useCurrentHcp()

const panel = ref<HTMLElement | null>(null)
const reel = ref<InstanceType<typeof Reel> | null>(null)

// filters start from the list's active filter, but changes here stay inside the overlay
const category = ref(ui.activeCategory)
const place = ref('')
const maxMinutes = ref(0)
const biasFavorites = ref(false)

const spinTick = ref(0)
const spinning = ref(false)
const target = ref<Drill | null>(null)
const result = ref<Drill | null>(null)
const announce = ref('')
/** Picks of this overlay session, newest last (avoid repeating them). */
const picks = ref<string[]>([])

// focus handling: remember what opened the overlay and give focus back on close
let opener: HTMLElement | null = null

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await Promise.all([
    catalog.loaded ? null : catalog.load(),
    favorites.loaded ? null : favorites.load(),
    sessions.loaded ? null : sessions.load(),
    settings.loaded ? null : settings.load(),
  ])
  biasFavorites.value = settings.shuffleFavorites && favorites.list.length > 0
  await nextTick()
  focusFirst()
})

onUnmounted(() => {
  if (opener?.isConnected) opener.focus()
})

const categories = computed(() => Array.from(new Set(catalog.drills.map(d => d.category))).sort((a, b) => a.localeCompare(b, 'de')))
const hasAnyFavorites = computed(() => (favorites.list?.length ?? 0) > 0)

const pool = computed(() => catalog.drills.filter(d =>
  (!category.value || d.category === category.value) &&
  (!place.value || locationGroup(d) === place.value) &&
  (!maxMinutes.value || drillMinutes(d) <= maxMinutes.value) &&
  (!ui.activeTag || d.tags?.includes(ui.activeTag)),
))
const nameItems = computed(() => Array.from(new Set(pool.value.map(d => d.title))).sort((a, b) => a.localeCompare(b, 'de')))

const difficulty = computed(() => {
  const b = result.value?.difficulty?.base
  return typeof b === 'number' ? Math.min(5, Math.max(1, Math.round(b))) : 0
})

const targetText = computed(() => {
  const d = result.value
  if (!d) return ''
  if (currentHcp.value === null) return 'Trage dein Handicap ein, um dein Ziel für diesen Drill zu sehen.'
  const v = valueForLevel(resolveThresholds(d.metric.hcpTargets, currentHcp.value), 2, !!d.metric.smallerIsBetter)
  return v === null ? 'Für diesen Drill gibt es keinen Zielwert.' : `Ziel bei HCP ${formatHcp(currentHcp.value)}: ${v} ${d.metric.unit}`
})

function prefersReducedMotion(): boolean {
  try { return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function recentIds(): string[] {
  const lastSessions = [...sessions.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT_SESSIONS).map(s => s.drillId)
  return [...lastSessions, ...picks.value]
}

function spin() {
  if (spinning.value || pool.value.length === 0) return
  const drill = pickRandomDrill(pool.value, { recent: recentIds(), favorites: new Set(favorites.list), biasFavorites: biasFavorites.value })
  if (!drill) return
  target.value = drill
  result.value = null
  announce.value = ''
  if (prefersReducedMotion()) {
    reveal(drill)
    return
  }
  spinning.value = true
  spinTick.value++
}

function skip() {
  reel.value?.skip()
}

async function onStopped() {
  if (!spinning.value || !target.value) return
  spinning.value = false
  reveal(target.value)
}

function reveal(drill: Drill) {
  spinning.value = false
  result.value = drill
  picks.value = [...picks.value, drill.id].slice(-RECENT_SESSIONS)
  announce.value = `Zufalls-Drill: ${drill.title}, ${drill.category}, ${drillMinutes(drill)} Minuten`
  try { void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}) } catch { /* not available */ }
  void nextTick().then(() => panel.value?.querySelector<HTMLElement>('[data-testid="shuffle-start"]')?.focus())
}

function resetFilters() {
  category.value = ''
  place.value = ''
  maxMinutes.value = 0
  ui.setActiveTag('')
  result.value = null
}

async function go(autoStart: boolean) {
  const d = result.value
  if (!d) return
  if (autoStart) ui.requestStart(d.id)
  await router.push(withPreservedQuery({ name: 'DrillDetail', params: { id: d.id } }, route))
  ui.setShuffle(false)
}
const start = () => go(true)
const details = () => go(false)

function close() {
  ui.setShuffle(false)
}

function focusables(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>('button, input, select, [href]') ?? []).filter(el => !(el as HTMLButtonElement).disabled)
}

function focusFirst() {
  const spinBtn = panel.value?.querySelector<HTMLElement>('[data-testid="shuffle-spin"]')
  ;(spinBtn ?? focusables()[0])?.focus()
}

/** Keep Tab inside the dialog. */
function trapTab(e: KeyboardEvent) {
  const items = focusables()
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1100;
  padding: 16px;
}

.overlay-panel {
  width: min(560px, 100%);
  max-height: 92vh;
  overflow: auto;
  border-radius: 16px;
  padding: 16px;
  background: var(--surface, #fff);
  box-shadow: 0 12px 38px rgba(0, 0, 0, 0.22);
}

.shuffle-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.shuffle-title {
  margin: 0;
  font-weight: 800;
  font-size: 1.25rem;
}

.shuffle-close {
  min-width: 40px;
  min-height: 40px;
  padding: 0;
}

.shuffle-loading,
.shuffle-error {
  display: block;
  padding: 16px;
}

.shuffle-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shuffle-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.fav-switch {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.fav-switch input {
  margin-top: 4px;
  width: 20px;
  height: 20px;
}

.fav-switch span {
  display: flex;
  flex-direction: column;
}

.pool-count {
  margin: 0;
  font-size: 0.85rem;
}

.shuffle-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  margin: 0;
}

.result-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.result-target {
  margin: 0;
  font-weight: 600;
}

.result-actions,
.spin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spin-btn {
  min-width: 140px;
}
</style>
