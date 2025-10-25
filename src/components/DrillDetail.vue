<template>
  <section class="card" style="max-width: 720px;">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <div>
        <h2 style="margin:0; font-size:1.25rem; font-weight:700;">{{ drill.title }}</h2>
        <p style="color:var(--muted); margin:.25rem 0 0">{{ drill.category }}</p>
      </div>
      <!-- Favorite toggle -->
      <button
        type="button"
        class="btn"
        :aria-pressed="isFav"
        :aria-label="isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
        @click="toggleFavorite"
        title="Favorit"
      >
        <span aria-hidden="true">{{ isFav ? '★' : '☆' }}</span>
      </button>
    </header>

    <!-- Equipment -->
    <div class="row" style="margin-top:8px;">
      <div v-if="drill.equipment?.balls != null" class="chip" title="Bälle">
        🟢 × {{ drill.equipment.balls }}
      </div>
      <div v-if="(drill.equipment?.clubs?.length ?? 0) > 0" class="chip" title="Schläger">
        ⛳️ {{ drill.equipment.clubs?.join(', ') }}
      </div>
      <div v-if="(drill.equipment?.other?.length ?? 0) > 0" class="chip" title="Sonstiges">
        🧰 {{ drill.equipment.other?.join(', ') }}
      </div>
    </div>

    <!-- Setup -->
    <div class="row" style="margin-top:8px; align-items:flex-start;">
      <div style="flex:2; min-width:220px;">
        <h3 class="label" style="margin-bottom:4px;">Setup</h3>
        <p style="margin:0;">{{ drill.setup.schema }}</p>
        <p v-if="drill.setup.location" style="margin:.25rem 0 0; color:var(--muted)"><strong>Ort:</strong> {{ drill.setup.location }}</p>
      </div>
      <div style="flex:1; min-width:160px;">
        <div class="border border-dashed rounded-md" style="border-color:var(--border); background:var(--bg); height:92px; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:12px;">
          Diagramm
        </div>
      </div>
    </div>

    <!-- Duration / Difficulty -->
    <div class="row" style="margin-top:8px;">
      <div class="chip" title="Empfohlene Dauer" v-if="drill.duration?.suggestedMin">⏱️ {{ drill.duration.suggestedMin }} min</div>
      <div class="chip" title="Timer" v-if="drill.duration?.timerPreset">▶ {{ Math.round(drill.duration.timerPreset / 60) }} min Timer</div>
      <div class="chip" title="Schwierigkeit" v-if="(drill as any).difficulty?.base">★ {{ (drill as any).difficulty.base }}/5</div>
    </div>

    <!-- Simple Timer (optional) -->
    <div v-if="drill.duration?.timerPreset" style="margin-top:8px;">
      <SimpleTimer :preset-seconds="drill.duration.timerPreset" @elapsed="onElapsed" />
    </div>

    <!-- Procedure -->
    <div style="margin-top:10px;">
      <h3 class="label" style="margin-bottom:4px;">Ablauf</h3>
      <p style="margin:0;">{{ drill.instructions.training }}</p>
      <p v-if="drill.instructions.test" style="margin:.25rem 0 0; color:var(--muted)"><strong>Test:</strong> {{ drill.instructions.test }}</p>
      <p v-if="drill.instructions.tooEasy" style="margin:.25rem 0 0; color:var(--muted)"><strong>Zu leicht?</strong> {{ drill.instructions.tooEasy }}</p>
    </div>

    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span class="chip" v-for="t in drill.tags" :key="t">{{ t }}</span>
    </div>

    <hr class="hr" />

    <!-- Metric -->
    <div>
      <strong>Metrik:</strong> <span>{{ drill.metric.type }}</span>
      <span class="chip" aria-label="Einheit">Einheit: {{ drill.metric.unit }}</span>
    </div>

    <!-- Session controls & input -->
    <div class="card" style="margin-top:10px;">
      <div class="row" style="align-items:center; justify-content:space-between;">
        <h3 class="label" style="margin:0;">Session</h3>
        <span v-if="active" class="chip" aria-live="polite" role="status">Aktiv</span>
      </div>

      <!-- Metric input tied to this drill; disabled until session active -->
      <MetricValueInput
        :drill="drill"
        v-model="value"
        :disabled="!active"
        :label="drill.metric.unit"
      />

      <!-- Optional increment button for count_in_time to track attempts during the session -->
      <div v-if="active && drill.metric.type === 'count_in_time'" class="row" style="align-items:center;">
        <button
          class="btn"
          type="button"
          @click="incAttempts"
          :aria-label="`+1 Versuch zu ${drill.title}`"
          data-testid="attempts-inc"
        >+1</button>
        <span class="chip" aria-live="polite" role="status" data-testid="attempts-chip">
          Versuche: {{ attemptsCount }}
        </span>
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
    <HcpTargetsTable :drill="drill" />

    <!-- Session History for this drill -->
    <SessionHistory :drill-id="drill.id" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import type { Drill, Session } from '@/types'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'
import SimpleTimer from '@/components/SimpleTimer.vue'
import MetricValueInput from '@/components/MetricValueInput.vue'
import SessionHistory from '@/components/SessionHistory.vue'

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
  const session: Omit<Session, 'id'> & Partial<Pick<Session, 'id'>> = {
    drillId: props.drill.id,
    date: new Date().toISOString(),
    hcp: typeof settings.hcp === 'number' ? settings.hcp : 0,
    result: { value: value.value as number, unit: props.drill.metric.unit },
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
