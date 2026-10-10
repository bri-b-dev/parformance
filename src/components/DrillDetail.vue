<template>
  <section ref="root" class="card drill-detail" :class="{ 'dd-embedded': embedded }">
    <!-- Sticky head: title, favorite and the primary actions stay in reach while scrolling -->
    <header class="dd-head" data-testid="dd-head">
      <div class="dd-title-row">
        <div class="dd-title">
          <h2 class="dd-h">{{ drill.title }}</h2>
          <div class="dd-meta">
            <span class="chip">{{ drill.category }}</span>
            <span class="chip" data-testid="dd-minutes">{{ minutes }} Min.</span>
            <span v-if="difficulty" class="chip" :aria-label="`Schwierigkeit ${difficulty} von 5`" data-testid="dd-difficulty">{{ '●'.repeat(difficulty) }}{{ '○'.repeat(5 - difficulty) }}</span>
          </div>
          <p v-if="focus.active" class="focus-line" data-testid="focus-chip">
            <span class="chip">Fokus: {{ focus.active.label }}</span>
            <span v-if="inFocusCollection" class="muted"> - dieser Drill gehört zum Fokus</span>
          </p>
        </div>
        <!-- Favorite toggle -->
        <button type="button" class="btn dd-fav" :aria-pressed="isFav"
          :aria-label="isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'" title="Favorit"
          @click="toggleFavorite">
          <span aria-hidden="true">{{ isFav ? '★' : '☆' }}</span>
        </button>
      </div>

      <div class="dd-actions">
        <template v-if="!active">
          <button class="btn btn-primary" type="button" data-testid="dd-start" @click="startSession()">Starten</button>
          <button class="btn" type="button" data-testid="dd-quick" @click="startSession({ quick: true })">Ergebnis eintragen</button>
        </template>
        <template v-else>
          <output class="chip" aria-live="polite" data-testid="dd-active">{{ quick ? 'Ergebnis erfassen' : 'Session läuft' }}</output>
          <!-- quick entry only: in live mode these actions are part of the full-screen view -->
          <template v-if="quick">
            <button class="btn" type="button" data-testid="dd-cancel" @click="cancelSession">Abbrechen</button>
            <button class="btn btn-primary" type="button" :disabled="!canSave" data-testid="dd-save" @click="saveSession">Speichern</button>
          </template>
        </template>
      </div>
    </header>

    <!-- Quick result entry (no timer): inline input -->
    <div v-if="active && quick" class="card dd-session" data-testid="dd-session">
      <MetricValueInput v-if="drill.metric.unit" v-model="value" :drill="drill" />
    </div>

    <!-- Live mode: full screen with timer, big counters and the save button -->
    <LiveSession v-if="active && !quick" :drill="drill" :value="value" :attempts="attemptsCount"
      @update:value="value = $event" @update:attempts="attemptsCount = $event" @elapsed="onElapsed" @save="saveSession" @cancel="requestCancel" />

    <!-- Completion sheet after saving -->
    <ResultSheet v-if="done" :summary="done.summary" :drill-title="drill.title" :previous-count="done.previousCount" :next-label="nextLabel"
      @again="onSheet('again', $event)" @next="onSheet('next', $event)" @done="onSheet('done', $event)" />

    <!-- Sections -->
    <div class="dd-tabs" role="tablist" aria-label="Inhalt des Drills">
      <button v-for="(t, i) in TABS" :id="`dd-tab-${t.id}`" :key="t.id" type="button" role="tab" class="dd-tab" :class="{ on: tab === t.id }"
        :aria-selected="tab === t.id" :aria-controls="`dd-panel-${t.id}`" :tabindex="tab === t.id ? 0 : -1" :data-testid="`dd-tab-${t.id}`"
        @click="tab = t.id" @keydown="onTabKey($event, i)">{{ t.label }}</button>
    </div>

    <div :id="`dd-panel-${tab}`" class="dd-panel" role="tabpanel" :aria-labelledby="`dd-tab-${tab}`" data-testid="dd-panel">
      <DrillDetailGrid v-if="tab === 'setup'" :drill="drill" section="setup" />
      <DrillDetailGrid v-else-if="tab === 'flow'" :drill="drill" section="flow" />
      <template v-else-if="tab === 'goals'">
        <HcpTargetsTable v-if="drill.metric.hcpTargets" :drill="drill" />
        <DrillStatsSummary :drill-id="drill.id" :unit="drill.metric.unit" />
      </template>
      <SessionHistory v-else :drill-id="drill.id" />
    </div>

    <!-- Collapsible extras -->
    <details v-if="hasExtra" class="card dd-extra" data-testid="dd-extra">
      <summary>Zu leicht? Varianten</summary>
      <DrillDetailGrid :drill="drill" section="extra" />
    </details>

    <!-- Gambler's tip / Zocker-Tipp (collapsible) -->
    <GamblerTipPanel :drill-id="drill.id" :tip="tipForDrill" />
  </section>
</template>

<script setup lang="ts">
import DrillStatsSummary from '@/components/DrillStatsSummary.vue'
import GamblerTipPanel from '@/components/GamblerTipPanel.vue'
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'
import MetricValueInput from '@/components/MetricValueInput.vue'
import SessionHistory from '@/components/SessionHistory.vue'
import LiveSession from '@/components/LiveSession.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import DrillDetailGrid from './DrillDetailGrid.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { computeLevelForDrill } from '@/hcp/level'
import { useCollectionsStore } from '@/stores/collections'
import { useFavoritesStore } from '@/stores/favorites'
import { useFocusStore } from '@/stores/focus'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useRunStore } from '@/stores/run'
import { useUiStore } from '@/stores/ui'
import { summarizeResult, type ResultSummary } from '@/session/summary'
import { requestConfirm } from '@/utils/confirmService'
import { drillMinutes } from '@/today/suggest'
import type { Drill, Session } from '@/types'
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps<{ drill: Drill; /** Inside a guided session: no sticky head. */ embedded?: boolean }>()

type TabId = 'setup' | 'flow' | 'goals' | 'history'
const TABS: { id: TabId; label: string }[] = [
  { id: 'setup', label: 'Aufbau' },
  { id: 'flow', label: 'Ablauf' },
  { id: 'goals', label: 'Ziele' },
  { id: 'history', label: 'Verlauf' },
]

const favorites = useFavoritesStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const focus = useFocusStore()
const collections = useCollectionsStore()
const ui = useUiStore()
const run = useRunStore()
const { hcp: currentHcp } = useCurrentHcp()

const root = ref<HTMLElement | null>(null)
const tab = ref<TabId>('setup')

onMounted(async () => {
  if (!favorites.loaded) favorites.load()
  if (!focus.loaded) await focus.load()
  if (!collections.loaded) await collections.load()
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
  // Ensure the view starts at the top when opening a drill detail.
  // The app's main element is the scroll container, so scroll that if present.
  await nextTick()
  const mainEl = globalThis.document?.querySelector('main')
  if (mainEl && typeof (mainEl as any).scrollTo === 'function') {
    (mainEl as any).scrollTo({ top: 0, left: 0, behavior: 'auto' })
  } else if (globalThis.window !== undefined && typeof globalThis.window.scrollTo === 'function') {
    globalThis.window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
  // "Starten" in the shuffle overlay opens the drill with the session already running
  if (ui.consumeStart(props.drill.id)) await startSession()
})

const minutes = computed(() => drillMinutes(props.drill))
const difficulty = computed(() => {
  const b = props.drill.difficulty?.base
  return typeof b === 'number' ? Math.min(5, Math.max(1, Math.round(b))) : 0
})

const inFocusCollection = computed(() => {
  const cid = focus.active?.collectionId
  return !!cid && !!collections.byId(cid)?.drillIds.includes(props.drill.id)
})

const isFav = computed(() => favorites.isFavorite(props.drill.id))

async function toggleFavorite() {
  await favorites.toggle(props.drill.id)
}

const hasExtra = computed(() => !!props.drill.instructions?.tooEasy || (props.drill.variants?.length ?? 0) > 0)

function onTabKey(e: KeyboardEvent, i: number) {
  const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }
  if (!(e.key in keys)) return
  e.preventDefault()
  const next = (keys[e.key] + TABS.length) % TABS.length
  tab.value = TABS[next].id
  void nextTick().then(() => root.value?.querySelector<HTMLElement>(`#dd-tab-${TABS[next].id}`)?.focus())
}

// Active session state
const active = ref(false)
/** Quick result entry: no timer, the value field is focused right away. */
const quick = ref(false)
const value = ref<number | null>(null)
const lastElapsed = ref<number>(0)
const attemptsCount = ref<number>(0)

const canSave = computed(() => active.value && value.value != null && Number.isFinite(value.value))

const tipForDrill = computed(() => (props.drill as any).gamerTip ?? (props.drill as any).zockerTip)

async function startSession(opts: { quick?: boolean } = {}) {
  active.value = true
  quick.value = !!opts.quick
  await nextTick()
  // quick entry: the field is focused right away (live mode focuses its own field)
  if (quick.value) root.value?.querySelector<HTMLInputElement>('.metric-input')?.focus()
}

function cancelSession() {
  // Reset all transient state
  active.value = false
  quick.value = false
  value.value = null
  lastElapsed.value = 0
  attemptsCount.value = 0
}

/** Leaving the live view discards what was entered: ask first if there is something to lose. */
async function requestCancel() {
  const hasProgress = value.value !== null || lastElapsed.value > 10 || attemptsCount.value > 0
  if (hasProgress && !(await requestConfirm('Session verwerfen? Das Ergebnis wird nicht gespeichert.'))) return
  cancelSession()
}

async function saveSession() {
  if (!canSave.value) return
  const level = computeLevelForDrill(props.drill, currentHcp.value, value.value as number)
  const session: Omit<Session, 'id'> & Partial<Pick<Session, 'id'>> = {
    drillId: props.drill.id,
    date: new Date().toISOString(),
    hcp: currentHcp.value,
    result: { value: value.value as number, unit: props.drill.metric.unit },
    levelReached: level,
    // Default favorite flag per acceptance criteria
    favorited: false,
  }
  if (focus.active) session.focusId = focus.active.id
  // Only attach timerUsed when the drill has a preset and the timer was part of the session
  if (props.drill.duration?.timerPreset && !quick.value) {
    session.timerUsed = lastElapsed.value
  }
  // Store attempts if this is a count_in_time drill (Acceptance Criteria)
  if (props.drill.metric.type === 'count_in_time') {
    session.attempts = attemptsCount.value
  }
  // earlier results, oldest first (the new one is not part of the comparison)
  const previousValues = sessions.listByDrill(props.drill.id).map(s => Number(s.result?.value)).reverse()
  const saved = await sessions.addSession(session)
  done.value = {
    sessionId: saved.id,
    previousCount: previousValues.length,
    summary: summarizeResult({ drill: props.drill, value: saved.result.value, previousValues, hcp: currentHcp.value }),
  }
  // Reset UI state after save
  cancelSession()
  // visible confirmation next to the sheet, with a short chance to take it back
  globalThis.dispatchEvent(new CustomEvent('toast', {
    detail: { type: 'success', message: 'Ergebnis gespeichert', actionLabel: 'Rückgängig', duration: 5000, onAction: () => void undo(saved.id) },
  }))
}

/** What the completion sheet shows; null while it is closed. */
const done = ref<{ sessionId: string; previousCount: number; summary: ResultSummary } | null>(null)

const nextLabel = computed(() => (props.embedded && run.run ? (run.isLast ? 'Einheit abschließen' : 'Nächster Drill') : 'Nächster Drill'))

async function undo(sessionId: string) {
  await sessions.remove(sessionId)
  if (done.value?.sessionId === sessionId) done.value = null
  globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message: 'Ergebnis zurückgenommen' } }))
}

async function onSheet(kind: 'again' | 'next' | 'done', note: string) {
  const d = done.value
  done.value = null
  if (d && note.trim()) await sessions.updateNotes(d.sessionId, note.trim())
  if (kind === 'again') await startSession()
  else if (kind === 'next') {
    if (props.embedded && run.run) run.next()
    else ui.setShuffle(true)
  }
}

function onElapsed(sec: number) {
  lastElapsed.value = sec
}
</script>

<style scoped>
.drill-detail {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
  /* clip (not hidden) so the sticky head keeps working */
  overflow-x: clip;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: calc(100vh - 144px);
}

/* Allow flex children to shrink on small viewports */
.drill-detail,
.drill-detail * {
  min-inline-size: 0;
}

.drill-detail > :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}

.drill-detail :deep(.card) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.drill-detail :deep(.row) {
  flex-wrap: wrap;
  gap: 8px;
}

.drill-detail :deep(.chip) {
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
  text-align: center;
}

.dd-head {
  position: sticky;
  top: var(--app-header-h, 0px);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.dd-embedded .dd-head {
  position: static;
}

.dd-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.dd-h {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.dd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.focus-line {
  margin: 4px 0 0;
}

.dd-fav {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  font-size: 1.2rem;
}

.dd-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dd-session {
  margin: 0;
  padding: 12px 14px;
}

.dd-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
}

.dd-tab {
  flex: none;
  padding: 10px 14px;
  min-height: 44px;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  color: var(--muted);
  font-weight: 600;
  cursor: pointer;
}

.dd-tab.on {
  color: var(--text);
  border-bottom-color: var(--primary);
}

.dd-tab:focus-visible {
  outline: 3px solid var(--ring, currentColor);
  outline-offset: -3px;
}

.dd-panel {
  min-height: 120px;
}

.dd-extra {
  margin: 0;
  padding: 10px 14px;
}

.dd-extra summary {
  cursor: pointer;
  font-weight: 600;
}
</style>
