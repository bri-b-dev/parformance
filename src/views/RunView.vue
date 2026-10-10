<template>
  <section class="container run" aria-labelledby="run-title">
    <template v-if="run.run">
      <!-- Summary -->
      <div v-if="run.finished" class="card run-card" data-testid="run-summary">
        <h1 id="run-title" class="run-h">Einheit abgeschlossen</h1>
        <p class="muted">{{ run.run.title }} - {{ run.doneCount }} von {{ run.total }} Drills gespeichert, {{ elapsedMinutes }} Min.</p>
        <ul class="run-steps">
          <li v-for="(s, i) in run.run.steps" :key="i" class="run-step">
            <span class="chip" :class="`chip-${s.status}`">{{ statusLabel(s.status) }}</span>
            <span class="run-step-title">{{ drillOf(s.drillId)?.title ?? s.drillId }}</span>
            <span v-if="resultOf(s)" class="muted">{{ resultOf(s) }}</span>
          </li>
        </ul>
        <div class="run-actions">
          <button type="button" class="btn btn-primary" data-testid="run-close" @click="close">Fertig</button>
        </div>
      </div>

      <!-- Walk-through -->
      <template v-else>
        <div class="run-bar" data-testid="run-bar">
          <div class="run-bar-top">
            <h1 id="run-title" class="run-h">{{ run.run.title }}</h1>
            <span class="chip" data-testid="run-position">Drill {{ run.run.index + 1 }} von {{ run.total }}</span>
          </div>
          <div class="run-progress" role="progressbar" aria-label="Fortschritt der Einheit" aria-valuemin="0" :aria-valuemax="run.total" :aria-valuenow="passed">
            <div class="run-progress-fill" :style="{ width: (passed / run.total) * 100 + '%' }"></div>
          </div>
          <p class="muted run-time" data-testid="run-time">Geplant {{ plannedMinutes }} Min. - noch ca. {{ remainingMinutes }} Min.</p>
          <div class="run-actions">
            <button type="button" class="btn" :disabled="run.run.index === 0" data-testid="run-back" @click="run.back()">Zurück</button>
            <button type="button" class="btn" :disabled="run.current?.status !== 'pending'" data-testid="run-skip" @click="run.skip()">Überspringen</button>
            <button type="button" class="btn btn-primary" :disabled="run.current?.status === 'pending'" data-testid="run-next" @click="run.next()">
              {{ run.isLast ? 'Abschließen' : 'Weiter' }}
            </button>
            <button type="button" class="btn" data-testid="run-end" @click="endEarly">Beenden</button>
          </div>
          <p v-if="run.current?.status === 'done'" class="muted" role="status">Ergebnis gespeichert - weiter zum nächsten Drill.</p>
        </div>

        <DrillDetail v-if="currentDrill" :key="currentDrill.id + '-' + run.run.index" :drill="currentDrill" embedded />
        <div v-else class="card run-card">
          <p>Dieser Drill ist nicht mehr im Katalog.</p>
          <button type="button" class="btn" @click="run.skip()">Überspringen</button>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import DrillDetail from '@/components/DrillDetail.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useRunStore, type RunStep } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { drillMinutes } from '@/today/suggest'
import { requestConfirm } from '@/utils/confirmService'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const run = useRunStore()
const catalog = useDrillCatalogStore()
const sessions = useSessionsStore()

onMounted(async () => {
  await Promise.all([
    run.loaded ? null : run.load(),
    catalog.loaded ? null : catalog.load(),
    sessions.loaded ? null : sessions.load(),
  ])
  if (!run.run) {
    await router.replace({ name: 'Today' })
    return
  }
  run.attachSession(sessions.sessions)
})

// A session saved in the embedded drill completes the current step.
watch(() => sessions.sessions.length, () => run.attachSession(sessions.sessions))

const drillOf = (id: string) => catalog.drills.find(d => d.id === id)
const currentDrill = computed(() => (run.current ? drillOf(run.current.drillId) : undefined))
const minutesOf = (s: RunStep) => { const d = drillOf(s.drillId); return d ? drillMinutes(d) : 10 }

const passed = computed(() => run.run?.steps.filter(s => s.status !== 'pending').length ?? 0)
const plannedMinutes = computed(() => run.run?.steps.reduce((n, s) => n + minutesOf(s), 0) ?? 0)
const remainingMinutes = computed(() => run.run?.steps.filter(s => s.status === 'pending').reduce((n, s) => n + minutesOf(s), 0) ?? 0)
const elapsedMinutes = computed(() => {
  const r = run.run
  if (!r?.finishedAt) return 0
  return Math.max(1, Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 60_000))
})

const statusLabel = (s: RunStep['status']) => (s === 'done' ? 'Gespeichert' : s === 'skipped' ? 'Übersprungen' : 'Offen')
function resultOf(s: RunStep): string {
  const sess = s.sessionId ? sessions.sessions.find(x => x.id === s.sessionId) : undefined
  return sess ? `${sess.result.value} ${sess.result.unit}` : ''
}

async function endEarly() {
  if (!(await requestConfirm('Einheit jetzt beenden? Nicht gespielte Drills bleiben offen.'))) return
  run.finish()
}

async function close() {
  run.clear()
  await router.push({ name: 'Today' })
}
</script>

<style scoped>
.run {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0;
  background: var(--bg);
}

.run-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.run-h {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.run-progress {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.run-progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.25s ease;
}

.run-time {
  margin: 0;
  font-size: 0.9rem;
}

.run-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.run-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
}

.run-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.run-step {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.run-step-title {
  font-weight: 600;
}
</style>
