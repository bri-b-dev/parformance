<template>
  <figure class="dpc" data-testid="drill-chart">
    <div class="dpc-head">
      <figcaption class="dpc-title">Verlauf der Ergebnisse</figcaption>
      <SegmentedControl v-model="days" :options="ZOOM" label="Zeitraum des Diagramms" testid="zoom" />
    </div>

    <p v-if="!model" class="muted" data-testid="chart-empty">
      {{ hasSessions ? 'In diesem Zeitraum gibt es keine Ergebnisse - wähle einen längeren.' : 'Noch keine Ergebnisse. Speichere eine Session, dann siehst du hier deinen Verlauf.' }}
    </p>

    <template v-else>
      <svg class="dpc-svg" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="model.summary" preserveAspectRatio="none">
        <g v-for="l in model.lines" :key="l.level">
          <line :x1="PAD_L" :x2="W - PAD_R" :y1="py(l.y)" :y2="py(l.y)" class="dpc-line" stroke-dasharray="4 4" :data-testid="`line-${l.level}`" />
          <text :x="W - PAD_R + 4" :y="py(l.y) + 4" class="dpc-star">{{ '★'.repeat(l.level) }}</text>
        </g>
        <polyline v-if="model.points.length > 1" :points="polyline" class="dpc-path" fill="none" />
        <circle v-for="(p, i) in model.points" :key="i" :cx="px(p.x)" :cy="py(p.y)" r="4" class="dpc-dot" :class="{ best: p.value === model.best }" data-testid="dot">
          <title>{{ dotTitle(p) }}</title>
        </circle>
      </svg>
      <p class="muted dpc-note">Aufwärts ist besser<template v-if="lowerIsBetter"> (hier zählen niedrigere Werte)</template>. Gestrichelt: Schwellen für ★ bis ★★★ bei deinem HCP.</p>
      <p class="sr-only" data-testid="chart-summary">{{ model.summary }}</p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import SegmentedControl from '@/components/SegmentedControl.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { resolveThresholds } from '@/hcp/buckets'
import { buildSeries, type ChartPoint } from '@/stats/series'
import { isSmallerBetter } from '@/session/summary'
import { useSessionsStore } from '@/stores/sessions'
import type { Drill } from '@/types'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{ drill: Drill }>()

const ZOOM = [
  { value: 30, label: '30 Tage' },
  { value: 90, label: '90 Tage' },
  { value: 0, label: 'Alles' },
]

// drawing area
const W = 320
const H = 150
const PAD_L = 8
const PAD_R = 34
const PAD_T = 10
const PAD_B = 10

const sessions = useSessionsStore()
const { hcp } = useCurrentHcp()

onMounted(async () => { if (!sessions.loaded) await sessions.load() })

const days = ref<number>(0)
const lowerIsBetter = computed(() => isSmallerBetter(props.drill))
const list = computed(() => sessions.listByDrill(props.drill.id))
const hasSessions = computed(() => list.value.length > 0)

const thresholds = computed(() => (hcp.value === null ? [] : resolveThresholds(props.drill.metric.hcpTargets, hcp.value)))
const model = computed(() => buildSeries({ sessions: list.value, thresholds: thresholds.value, smallerIsBetter: lowerIsBetter.value, days: days.value }))

const px = (x: number) => PAD_L + x * (W - PAD_L - PAD_R)
const py = (y: number) => H - PAD_B - y * (H - PAD_T - PAD_B)
const polyline = computed(() => (model.value?.points ?? []).map(p => `${px(p.x)},${py(p.y)}`).join(' '))
const dotTitle = (p: ChartPoint) => `${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(p.date))}: ${p.value}`
</script>

<style scoped>
.dpc {
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dpc-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dpc-title {
  font-weight: 700;
}

.dpc-svg {
  width: 100%;
  height: 150px;
  overflow: visible;
}

.dpc-line {
  stroke: var(--muted);
  stroke-width: 1;
  opacity: 0.7;
}

.dpc-star {
  fill: var(--muted);
  font-size: 10px;
}

.dpc-path {
  stroke: var(--primary);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.dpc-dot {
  fill: var(--surface);
  stroke: var(--primary);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.dpc-dot.best {
  fill: var(--primary);
}

.dpc-note {
  margin: 0;
  font-size: 0.85rem;
}
</style>
