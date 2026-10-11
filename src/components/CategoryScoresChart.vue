<template>
  <section class="card" :aria-label="title || 'Kategorien'">
    <header class="section-head">
      <h3 v-if="title" class="section-title">{{ title }}</h3>
      <small class="chip" aria-label="Anzahl Kategorien">{{ categories.length }} Kategorien</small>
    </header>

    <!-- SR-only textual summary for accessibility -->
    <output class="sr-only" aria-live="polite">
      {{ srSummary }}
    </output>

    <!-- Bars (mobile) -->
    <div v-if="actualMode === 'bar'" class="row bars">
      <div v-for="row in rows" :key="row.category" class="w-full">
        <div class="bar-label">
          <span>{{ row.category }}</span>
          <span>{{ row.value }}%</span>
        </div>
        <div class="w-full bar-track">
          <div :data-testid="`bar-${row.category}`" class="bar-fill" :class="{ weak: isWeak(row) }" :style="barStyle(row)"></div>
        </div>
      </div>
    </div>

    <!-- Radar (desktop) -->
    <div v-else class="w-full radar-wrap">
      <svg :width="svgSize" :height="svgSize" :viewBox="`0 0 ${svgSize} ${svgSize}`" aria-labelledby="radar-title"
        aria-describedby="radar-desc">
        <title id="radar-title">Radar Chart</title>
        <desc id="radar-desc">{{ srSummary }}</desc>
        <!-- grid circles -->
        <g :transform="`translate(${center}, ${center})`" class="radar-grid">
          <circle v-for="r in [0.25, 0.5, 0.75, 1]" :key="r" :r="r * radius" />
        </g>
        <!-- axes -->
        <g :transform="`translate(${center}, ${center})`" class="radar-axes">
          <line v-for="(cat, i) in categories" :key="cat" :x1="0" :y1="0" :x2="axisPoint(i).x" :y2="axisPoint(i).y" />
        </g>
        <!-- polygon for values -->
        <g :transform="`translate(${center}, ${center})`">
          <polygon :points="polygonPoints" class="radar-poly" />
          <!-- weakest point marker -->
          <circle v-if="weakestIndex >= 0" :cx="valuePoint(weakestIndex).x" :cy="valuePoint(weakestIndex).y" r="4" class="radar-weak" />
        </g>
        <!-- labels around -->
        <g class="radar-labels">
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

const isWeak = (row: { category: string }) => categories.value.indexOf(row.category) === weakestIndex.value

// only the data-driven geometry is inline; colors come from classes
function barStyle(row: { category: string, value: number }) {
  return { width: `${row.value}%` }
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


const srSummary = computed(() => {
  if (categories.value.length === 0) return 'Keine Kategorien vorhanden.'
  const parts = categories.value.map((c, i) => `${c}: ${values.value[i]} Prozent`)
  const weak = weakestIndex.value >= 0 ? categories.value[weakestIndex.value] : null
  return `Fähigkeiten je Kategorie. ${parts.join(', ')}. Schwächste Kategorie: ${weak ?? '-'}.`
})
</script>

<style scoped>
.bars {
  flex-direction: column;
  gap: var(--space-2);
}

.bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.bar-track {
  height: 10px;
  background: var(--border);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--primary);
}

.bar-fill.weak {
  background: var(--danger-600);
}

.radar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-grid {
  stroke: var(--border);
  fill: none;
}

.radar-axes {
  stroke: var(--border);
}

.radar-poly {
  fill: color-mix(in oklab, var(--primary) 15%, transparent);
  stroke: var(--primary);
  stroke-width: 2;
}

.radar-weak {
  fill: var(--danger-600);
}

.radar-labels {
  font-size: 11px;
  fill: currentColor;
}
</style>
