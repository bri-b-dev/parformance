<template>
  <section class="card" style="margin-top:10px;">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <h3 style="margin:0; font-weight:700;">Kurzstatistik</h3>
      <small v-if="count > 0" class="chip" aria-label="Anzahl Sessions">{{ count }} Einträge</small>
    </header>

    <output v-if="!sessionsLoaded" class="p-2 flex items-center text-sm text-gray-600" aria-live="polite">
      <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"
        aria-hidden="true"></span>
      Lädt…
    </output>

    <output v-else-if="count === 0" class="text-sm text-gray-600" aria-live="polite">
      Noch keine Daten.
    </output>

    <div v-else class="row" style="align-items:center;">
      <div class="chip" :aria-label="bestAria">🏅 Best: <strong
          style="margin-left:4px; color:inherit;">{{ best }}</strong><span v-if="unitLabel"> {{ unitLabel }}</span></div>
      <div class="chip" :aria-label="`Gleitender Schnitt (5): ${maLast5Label}`">
        📈 MA(5): <strong style="margin-left:4px; color:inherit;">{{ maLast5Label }}</strong>
      </div>
      <div class="chip" :aria-label="trendAria" title="Trend">
        <span aria-hidden="true">{{ trendSymbol }}</span>
      </div>
      <div style="margin-left:8px;">
  <SparklineLast v-if="valuesLast.length > 0" :values="valuesLast" :width="140" :height="28" color="#2F7A52" :smallerIsBetter="smallerIsBetter" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import SparklineLast from '@/components/SparklineLast.vue';
import { getMovingAverageTrend } from '@/stats/movingAverage';
import { useDrillCatalogStore } from '@/stores/drillCatalog';
import { useSessionsStore } from '@/stores/sessions';
import { computed, onMounted } from 'vue';

const props = withDefaults(defineProps<{ drillId: string; unit?: string | null }>(), {
  unit: '',
})

const sessions = useSessionsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})

const sessionsLoaded = computed(() => sessions.loaded)
const drillCatalog = useDrillCatalogStore()
const items = computed(() => sessions.listByDrill(props.drillId))
const count = computed(() => items.value.length)
const values = computed(() => items.value.map(s => Number(s.result?.value)).filter(v => Number.isFinite(v)))

// Provide last up-to-10 values in chronological order (oldest → newest)
const valuesLast = computed(() => {
  const v = (values.value || []).slice()
  if (!v.length) return []
  // sessions.listByDrill returns newest-first; reverse to chronological
  v.reverse()
  return v.slice(-10)
})

const drillMeta = computed(() => drillCatalog.drills.find(d => d.id === props.drillId))
const smallerIsBetter = computed(() => Boolean(drillMeta.value?.metric?.smallerIsBetter))
const best = computed(() => {
  if (!values.value.length) return 0
  return smallerIsBetter.value ? Math.min(...values.value) : Math.max(...values.value)
})

const ma = computed(() => getMovingAverageTrend(values.value))
// If smallerIsBetter, invert the semantic meaning of the trend so that 'up' always
// indicates improvement. We'll compute an effectiveTrend for display.
const effectiveTrend = computed(() => {
  const t = ma.value.trend
  if (!smallerIsBetter.value) return t
  if (t === 'up') return 'down'
  if (t === 'down') return 'up'
  return t
})
const maLast5Label = computed(() => ma.value.maLast5 !== undefined && ma.value.maLast5 !== null ? ma.value.maLast5.toFixed(1) : '–')

const trendSymbol = computed(() => {
  switch (effectiveTrend.value) {
    case 'up': return '↑'
    case 'down': return '↓'
    case 'flat':
    case 'na':
    default: return '→'
  }
})

const trendAria = computed(() => {
  switch (effectiveTrend.value) {
    case 'up': return 'Trend: steigend (letzte 5 vs. vorherige 5)'
    case 'down': return 'Trend: fallend (letzte 5 vs. vorherige 5)'
    case 'flat': return 'Trend: neutral (gleich)'
    case 'na':
    default: return 'Trend: neutral (zu wenige Daten)'
  }
})

const unitLabel = computed(() => props.unit?.trim() ?? '')
const bestAria = computed(() => unitLabel.value ? `Bester Wert: ${best.value} ${unitLabel.value}` : `Bester Wert: ${best.value}`)
</script>
