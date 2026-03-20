<template>
  <section class="card" :aria-label="title || 'Kategorien'">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <h3 v-if="title" style="margin:0; font-weight:700;">{{ title }}</h3>
      <small class="chip" aria-label="Anzahl Kategorien">{{ categories.length }} Kategorien</small>
    </header>

    <!-- SR-only textual summary for accessibility -->
    <output class="sr-only" aria-live="polite">
      {{ srSummary }}
    </output>

    <!-- Bars (mobile) -->
    <div v-if="actualMode === 'bar'" class="row" style="flex-direction:column; gap:8px;">
      <div v-for="row in rows" :key="row.category" class="w-full">
        <div
          style="display:flex; align-items:center; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span>{{ row.category }}</span>
          <span>{{ row.value }}%</span>
        </div>
        <div class="w-full" style="height:10px; background: var(--border); border-radius: 999px; overflow:hidden;">
          <div :data-testid="`bar-${row.category}`" :class="['h-full']" :style="barStyle(row)"></div>
        </div>
      </div>
    </div>

    <!-- Radar (desktop) -->
    <div v-else class="w-full" style="display:flex; align-items:center; justify-content:center;">
      <svg :width="svgSize" :height="svgSize" :viewBox="`0 0 ${svgSize} ${svgSize}`" aria-labelledby="radar-title"
        aria-describedby="radar-desc">
        <title id="radar-title">Radar Chart</title>
        <desc id="radar-desc">{{ srSummary }}</desc>
        <!-- grid circles -->
        <g :transform="`translate(${center}, ${center})`" stroke="var(--border)" fill="none">
          <circle v-for="r in [0.25, 0.5, 0.75, 1]" :key="r" :r="r * radius" />
        </g>
        <!-- axes -->
        <g :transform="`translate(${center}, ${center})`" stroke="var(--border)">
          <line v-for="(cat, i) in categories" :key="cat" :x1="0" :y1="0" :x2="axisPoint(i).x" :y2="axisPoint(i).y" />
        </g>
        <!-- polygon for values -->
        <g :transform="`translate(${center}, ${center})`">
          <polygon :points="polygonPoints" :fill="polyFill" :stroke="polyStroke" stroke-width="2" />
          <!-- weakest point marker -->
          <circle v-if="weakestIndex >= 0" :cx="valuePoint(weakestIndex).x" :cy="valuePoint(weakestIndex).y" r="4"
            fill="#ef4444" />
        </g>
        <!-- labels around -->
        <g font-size="11" fill="currentColor">
          <template v-for="(cat, i) in categories" :key="`lbl-${cat}`">
            <text :x="labelPoint(i).x" :y="labelPoint(i).y" text-anchor="middle" dominant-baseline="central">
              {{ cat }} ({{ values[i] }}%)
            </text>
          </template>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
  scores: Record<string, number>,
  title?: string,
  /** 'auto' picks based on viewport; tests/stories can force 'bar' or 'radar' */
  mode?: 'auto' | 'bar' | 'radar',
}>()

const internalMode = ref<'bar' | 'radar'>('bar')

onMounted(() => {
  if (props.mode === 'auto' || props.mode == null) {
    try {
      const w = globalThis.window === undefined ? 0 : globalThis.window.innerWidth
      internalMode.value = w >= 800 ? 'radar' : 'bar'
    } catch { internalMode.value = 'bar' }
  }
})

const actualMode = computed(() => {
  if (props.mode && props.mode !== 'auto') return props.mode
  return internalMode.value
})

const categories = computed(() => Object.keys(props.scores || {}))
const values = computed(() => categories.value.map(c => clampPct(props.scores[c])))

const rows = computed(() => {
  // highlight weakest by ordering? keep original; styling uses index
  return categories.value.map((c, i) => ({ category: c, value: values.value[i] }))
})

function clampPct(v: any): number {
  const n = Math.round(Number(v) || 0)
  return Math.max(0, Math.min(100, n))
}

const weakestIndex = computed(() => {
  let idx = -1; let min = Infinity
  for (let i = 0; i < values.value.length; i++) {
    const v = values.value[i]
    if (v < min) { min = v; idx = i }
  }
  return idx
})

function barStyle(row: { category: string, value: number }) {
  const isWeak = categories.value.indexOf(row.category) === weakestIndex.value
  const color = isWeak ? '#ef4444' /* red-500 */ : '#2F7A52' /* primary */
  return {
    width: `${row.value}%`,
    background: color,
    borderRadius: '999px',
  }
}

// Radar geometry
const svgSize = 320
const center = svgSize / 2
const radius = Math.min(svgSize, svgSize) * 0.35

function angleFor(i: number) {
  const n = Math.max(1, categories.value.length)
  return -Math.PI / 2 + (i * 2 * Math.PI) / n
}

function axisPoint(i: number) {
  const a = angleFor(i)
  // return coordinates relative to the group origin (the group is already translated to center)
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
}

function valuePoint(i: number) {
  const a = angleFor(i)
  const r = (values.value[i] / 100) * radius
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

function labelPoint(i: number) {
  const a = angleFor(i)
  const r = radius + 18
  return { x: center + Math.cos(a) * r, y: center + Math.sin(a) * r }
}

const polygonPoints = computed(() => {
  return categories.value.map((_c, i) => {
    const p = valuePoint(i)
    // polygon is rendered inside a group translated to the center, so use relative coords
    return `${p.x},${p.y}`
  }).join(' ')
})

const polyFill = computed(() => 'rgba(47,122,82,0.15)')
const polyStroke = computed(() => '#2F7A52')

const srSummary = computed(() => {
  if (categories.value.length === 0) return 'Keine Kategorien vorhanden.'
  const parts = categories.value.map((c, i) => `${c}: ${values.value[i]} Prozent`)
  const weak = weakestIndex.value >= 0 ? categories.value[weakestIndex.value] : null
  return `Fähigkeiten je Kategorie. ${parts.join(', ')}. Schwächste Kategorie: ${weak ?? '-'}.`
})
</script>
