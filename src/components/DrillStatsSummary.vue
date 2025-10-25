<template>
  <section class="card" style="margin-top:10px;">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <h3 style="margin:0; font-weight:700;">Kurzstatistik</h3>
      <small v-if="count > 0" class="chip" aria-label="Anzahl Sessions">{{ count }} Einträge</small>
    </header>

    <div v-if="!sessionsLoaded" class="p-2 flex items-center text-sm text-gray-600" role="status" aria-live="polite">
      <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-hidden="true"></span>
      Lädt…
    </div>

    <div v-else-if="count === 0" class="text-sm text-gray-600" role="status" aria-live="polite">
      Noch keine Daten.
    </div>

    <div v-else class="row" style="align-items:center;">
      <div class="chip" :aria-label="`Bester Wert: ${best} ${unit}`">🏅 Best: <strong style="margin-left:4px; color:inherit;">{{ best }}</strong> {{ unit }}</div>
      <div class="chip" :aria-label="`Gleitender Schnitt (5): ${maLast5Label}`">
        📈 MA(5): <strong style="margin-left:4px; color:inherit;">{{ maLast5Label }}</strong>
      </div>
      <div class="chip" :aria-label="trendAria" title="Trend">
        <span aria-hidden="true">{{ trendSymbol }}</span>
      </div>
      <div style="margin-left:8px;">
        <SparklineLast v-if="valuesLast.length > 0" :values="valuesLast" :width="140" :height="28" color="#2F7A52" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SparklineLast from '@/components/SparklineLast.vue'
import { useSessionsStore } from '@/stores/sessions'
import { getMovingAverageTrend } from '@/stats/movingAverage'

const props = defineProps<{ drillId: string; unit: string }>()

const sessions = useSessionsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})

const sessionsLoaded = computed(() => sessions.loaded)
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

const best = computed(() => values.value.length ? Math.max(...values.value) : 0)

const ma = computed(() => getMovingAverageTrend(values.value))
const maLast5Label = computed(() => ma.value.maLast5 != null ? ma.value.maLast5.toFixed(1) : '–')

const trendSymbol = computed(() => {
  switch (ma.value.trend) {
    case 'up': return '↑'
    case 'down': return '↓'
    case 'flat':
    case 'na':
    default: return '→'
  }
})

const trendAria = computed(() => {
  switch (ma.value.trend) {
    case 'up': return 'Trend: steigend (letzte 5 vs. vorherige 5)'
    case 'down': return 'Trend: fallend (letzte 5 vs. vorherige 5)'
    case 'flat': return 'Trend: neutral (gleich)'
    case 'na':
    default: return 'Trend: neutral (zu wenige Daten)'
  }
})

const unit = computed(() => props.unit)
</script>
