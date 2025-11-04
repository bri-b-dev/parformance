<template>
  <section class="card drill-detail">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <div>
        <h2 style="margin:0; font-size:1.25rem; font-weight:700;">{{ drill.title }}</h2>
        <p style="color:var(--muted); margin:.25rem 0 0">{{ drill.category }}</p>
      </div>
      <!-- Favorite toggle -->
      <button type="button" class="btn" :aria-pressed="isFav"
        :aria-label="isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'" @click="toggleFavorite"
        title="Favorit">
        <span aria-hidden="true">{{ isFav ? '★' : '☆' }}</span>
      </button>
    </header>

    <DrillDetailGrid :drill="drill" />

    <hr class="hr" />

    <!-- Metric -->
    <div class="section">
      <strong>Timer & Messwert</strong>

      <!-- Session controls & input -->
      <div class="card" style="margin-top:10px;">
        <div class="row" style="align-items:center; justify-content:space-between;">
          <h3 class="label" style="margin:0;">Session</h3>
          <output v-if="active" class="chip" aria-live="polite">Aktiv</output>
        </div>

        <!-- Metric input tied to this drill; disabled until session active -->
        <MetricValueInput v-if="drill.metric.unit" :drill="drill" v-model="value" :disabled="!active" />

        <!-- Optional increment button for count_in_time to track attempts during the session -->
        <div v-if="active && drill.metric.type === 'count_in_time'" class="row" style="align-items:center;">
          <button class="btn" type="button" @click="incAttempts" :aria-label="`+1 Versuch zu ${drill.title}`"
            data-testid="attempts-inc">+1</button>
          <output class="chip" aria-live="polite" data-testid="attempts-chip">
            Versuche: {{ attemptsCount }}
          </output>
        </div>

        <div class="row">
          <button v-if="!active" class="btn btn-primary" type="button" @click="startSession">Session starten</button>
          <template v-else>
            <button class="btn" type="button" @click="cancelSession">Abbrechen</button>
            <button class="btn btn-primary" type="button" @click="saveSession" :disabled="!canSave">Speichern</button>
          </template>
        </div>

        <!-- Optional timer when preset exists; show only while active; start programmatically on session start -->
        <div v-if="active && drill.duration?.timerPreset" style="margin-top:8px;">
          <SimpleTimer ref="timerRef" :preset-seconds="drill.duration.timerPreset" @elapsed="onElapsed" />
        </div>
      </div>

      <!-- HCP Targets -->
      <div v-if="drill.metric.hcpTargets" style="margin-top:10px;">
        <HcpTargetsTable :drill="drill" />
      </div>

      <!-- Stats summary: Best, MA(5), Trend -->
      <DrillStatsSummary :drill-id="drill.id" :unit="drill.metric.unit" />

    </div>
    <!-- Gambler's tip / Zocker-Tipp -->
    <GamblerTipPanel v-if="drill" :drillId="drill.id" :tip="tipForDrill" />

    <!-- Session History for this drill -->
    <SessionHistory :drill-id="drill.id" />
  </section>
</template>

<script setup lang="ts">
import DrillStatsSummary from '@/components/DrillStatsSummary.vue'
import GamblerTipPanel from '@/components/GamblerTipPanel.vue'
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'
import MetricValueInput from '@/components/MetricValueInput.vue'
import SessionHistory from '@/components/SessionHistory.vue'
import SimpleTimer from '@/components/SimpleTimer.vue'
import { computeLevelForDrill } from '@/hcp/level'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { Drill, Session } from '@/types'
import { computed, nextTick, onMounted, ref } from 'vue'
import DrillDetailGrid from './DrillDetailGrid.vue'

const props = defineProps<{ drill: Drill }>()

const favorites = useFavoritesStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()

onMounted(async () => {
  if (!favorites.loaded) favorites.load()
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
})

const isFav = computed(() => favorites.isFavorite(props.drill.id))

async function toggleFavorite() {
  await favorites.toggle(props.drill.id)
}

// Active session state
const active = ref(false)
const value = ref<number | null>(null)
const timerRef = ref<any>(null)
const lastElapsed = ref<number>(0)
const attemptsCount = ref<number>(0)

const canSave = computed(() => active.value && value.value != null && Number.isFinite(value.value))

const tipForDrill = computed(() => (props.drill as any).gamerTip ?? (props.drill as any).zockerTip)

async function startSession() {
  active.value = true
  // Wait for timer to mount, then start it
  await nextTick()
  timerRef.value?.start?.()
}

function cancelSession() {
  // Reset all transient state
  active.value = false
  value.value = null
  lastElapsed.value = 0
  attemptsCount.value = 0
  timerRef.value?.reset?.()
  timerRef.value?.pause?.()
}

function incAttempts() {
  if (!active.value) return
  attemptsCount.value += 1
}

async function saveSession() {
  if (!canSave.value) return
  const level = computeLevelForDrill(props.drill, settings.hcp, value.value as number)
  const session: Omit<Session, 'id'> & Partial<Pick<Session, 'id'>> = {
    drillId: props.drill.id,
    date: new Date().toISOString(),
    hcp: typeof settings.hcp === 'number' ? settings.hcp : 0,
    result: { value: value.value as number, unit: props.drill.metric.unit },
    levelReached: level,
    // Default favorite flag per acceptance criteria
    favorited: false,
  }
  // Only attach timerUsed when the drill has a preset (per acceptance)
  if (props.drill.duration?.timerPreset) {
    session.timerUsed = lastElapsed.value
  }
  // Store attempts if this is a count_in_time drill (Acceptance Criteria)
  if (props.drill.metric.type === 'count_in_time') {
    session.attempts = attemptsCount.value
  }
  await sessions.addSession(session)
  // Reset UI state after save
  cancelSession()
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
  overflow: hidden;
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
}

.drill-detail > :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}

.drill-detail :deep(.card) {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
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

.drill-detail .section {
  width: 100%;
  box-sizing: border-box;
}
</style>
