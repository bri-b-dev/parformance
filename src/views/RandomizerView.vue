<template>
  <section class="p-4 container">
    <div class="card" role="dialog" aria-modal="true" aria-labelledby="shuffle-title">
      <header style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
        <h2 id="shuffle-title" style="margin:0; font-weight:700;">Zufallsauswahl</h2>
        <button class="btn" type="button" @click="close" aria-label="Schließen">✕</button>
      </header>

      <!-- Loading / Error -->
      <div v-if="!catalog.loaded" class="p-4 flex items-center text-sm text-gray-600" role="status" aria-live="polite">
        <span class="inline-block h-4 w-4 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-hidden="true"></span>
        Lädt…
      </div>
      <div v-else-if="catalog.error" class="p-4 text-sm text-red-700" role="status" aria-live="polite">
        {{ catalog.error }}
      </div>

      <!-- Content -->
      <div v-else>
        <div class="row" style="align-items:center; justify-content:center; margin:10px 0; gap:10px;">
          <!-- Reel: Category -->
          <div class="card" style="min-width:220px; text-align:center;">
            <div class="label">Kategorie</div>
            <div class="reel-viewport" :aria-live="spinning.category ? 'off' : 'polite'" role="status">
              <div class="reel-track" :style="catTransformStyle">
                <div v-for="c in catItems" :key="`cat-${c}`" class="reel-item">{{ c }}</div>
              </div>
            </div>
          </div>
          <!-- Reel: Drill -->
          <div class="card" style="min-width:260px; text-align:center;">
            <div class="label">Drill</div>
            <div class="reel-viewport" :aria-live="spinning.drill ? 'off' : 'polite'" role="status">
              <div class="reel-track" :style="drillTransformStyle">
                <div v-for="t in drillItems" :key="`dr-${t}`" class="reel-item">{{ t }}</div>
              </div>
            </div>
          </div>
          <!-- Reel: Target type (optional) -->
          <div class="card" style="min-width:200px; text-align:center;">
            <div class="label">Zieltyp</div>
            <div class="reel-viewport" :aria-live="spinning.target ? 'off' : 'polite'" role="status">
              <div class="reel-track" :style="targetTransformStyle">
                <div v-for="t in targetItems" :key="`tg-${t}`" class="reel-item">{{ t }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row" style="justify-content:center; margin-top:10px;">
          <button class="btn btn-primary" type="button" :disabled="disabled || running" @click="start" data-testid="shuffle-start">Start</button>
          <button class="btn" type="button" :disabled="!running" @click="cancel" data-testid="shuffle-cancel">Abbrechen</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import type { Drill } from '@/types'

// Configurable durations per reel (ms)
const props = defineProps<{ durationCatMs?: number; durationDrillMs?: number; durationTargetMs?: number }>()
const D_CAT = computed(() => props.durationCatMs ?? 600)
const D_DRILL = computed(() => props.durationDrillMs ?? 700)
const D_TARGET = computed(() => props.durationTargetMs ?? 500)

// Reduced motion
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch { return false }
}

// Store & router
const catalog = useDrillCatalogStore()
const router = useRouter()

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
})

const disabled = computed(() => (catalog.drills.length === 0))

// Data sources
const categories = computed(() => {
  const set = new Set<string>()
  for (const d of catalog.drills) set.add(d.category)
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

function drillsFor(cat: string): Drill[] {
  return catalog.drills.filter(d => d.category === cat)
}

// Reel visual state
const itemHeight = 28 // px
const catOffset = ref(0)
const drillOffset = ref(0)
const targetOffset = ref(0)

const catItems = computed(() => (categories.value.length ? categories.value : ['—']))
const drillItems = computed(() => {
  const cat = display.category || categories.value[0]
  const list = drillsFor(cat)
  return list.length ? list.map(d => d.title) : ['—']
})
const targetItems = computed(() => {
  const d = selectedDrill.value
  return d?.metric?.type ? [String(d.metric.type)] : ['—']
})

const catTransformStyle = computed(() => ({ transform: `translateY(${-catOffset.value}px)` }))
const drillTransformStyle = computed(() => ({ transform: `translateY(${-drillOffset.value}px)` }))
const targetTransformStyle = computed(() => ({ transform: `translateY(${-targetOffset.value}px)` }))

// Display state (selected labels)
const display = reactive<{ category: string | null; drill: string | null; target: string | null }>({
  category: null,
  drill: null,
  target: null,
})

const selectedDrill = ref<Drill | null>(null)
const running = ref(false)

const spinning = reactive({ category: false, drill: false, target: false })
let timers: any[] = []
let rafIds: any[] = []

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  for (const r of rafIds) cancelAnimationFrame(r)
  timers = []
  rafIds = []
}

function spin(items: string[], offsetRef: { value: number }, durationMs: number, onTick?: (index: number) => void): { stop: () => void } | null {
  if (!items.length || durationMs <= 0) return null
  const total = items.length * itemHeight
  let startTs: number | null = null
  let stopped = false
  const speed = Math.max(100, total * 2) // px/s baseline

  const tick = (ts: number) => {
    if (stopped) return
    if (startTs == null) startTs = ts
    const elapsed = ts - startTs
    const dist = Math.min(elapsed / 1000 * speed, 1e9)
    offsetRef.value = dist % total
    const idx = Math.floor((offsetRef.value + (itemHeight/2)) / itemHeight) % items.length
    onTick && onTick(idx)
    rafIds.push(requestAnimationFrame(tick))
  }
  rafIds.push(requestAnimationFrame(tick))
  return { stop: () => { stopped = true } }
}

async function start() {
  if (disabled.value || running.value) return
  running.value = true
  // Reset
  selectedDrill.value = null
  display.category = null
  display.drill = null
  display.target = null
  spinning.category = spinning.drill = spinning.target = false
  catOffset.value = drillOffset.value = targetOffset.value = 0
  clearTimers()

  const reduce = prefersReducedMotion()

  // 1) Category reel
  const cats = categories.value
  if (reduce) {
    display.category = cats[0] || null
  } else {
    spinning.category = true
    const ctl = spin(cats, catOffset, D_CAT.value, (i) => (display.category = cats[i]))
    // stop after duration
    timers.push(setTimeout(() => {
      spinning.category = false
      ctl?.stop()
      // Snap to nearest index
      const idx = Math.floor((catOffset.value + (itemHeight/2)) / itemHeight) % (cats.length || 1)
      display.category = cats[idx] || null
      nextStage()
    }, D_CAT.value))
  }
  if (reduce) nextStage()

  function nextStage() {
    const chosenCat = display.category || cats[0]
    const list = drillsFor(chosenCat)
    const drillTitles = list.map(d => d.title)

    if (reduce) {
      display.drill = drillTitles[0] || null
      afterDrill()
      return
    }

    spinning.drill = true
    const ctl = spin(drillTitles, drillOffset, D_DRILL.value, (i) => (display.drill = drillTitles[i]))
    timers.push(setTimeout(() => {
      spinning.drill = false
      ctl?.stop()
      const idx = Math.floor((drillOffset.value + (itemHeight/2)) / itemHeight) % (drillTitles.length || 1)
      const title = drillTitles[idx] || drillTitles[0]
      display.drill = title
      selectedDrill.value = list.find(x => x.title === title) || list[0] || null
      afterDrill()
    }, D_DRILL.value))
  }

  function afterDrill() {
    const d = selectedDrill.value || drillsFor(display.category || cats[0])[0] || null
    if (!selectedDrill.value && d) selectedDrill.value = d
    const tgt = d?.metric?.type ? [String(d.metric.type)] : []

    if (tgt.length === 0) {
      // finish soon
      timers.push(setTimeout(() => finish(), reduce ? 0 : 200))
      return
    }

    if (reduce) {
      display.target = tgt[0]
      finish()
      return
    }

    spinning.target = true
    const ctl = spin(tgt, targetOffset, D_TARGET.value, (i) => (display.target = tgt[i]))
    timers.push(setTimeout(() => {
      spinning.target = false
      ctl?.stop()
      const idx = Math.floor((targetOffset.value + (itemHeight/2)) / itemHeight) % (tgt.length || 1)
      display.target = tgt[idx]
      finish()
    }, D_TARGET.value))
  }
}

function cancel() {
  running.value = false
  clearTimers()
  spinning.category = spinning.drill = spinning.target = false
}

function finish() {
  running.value = false
  const d = selectedDrill.value
  if (d && d.id) {
    router.push({ name: 'DrillDetail', params: { id: d.id } })
  }
}

function close() {
  router.back()
}

onBeforeUnmount(() => clearTimers())
</script>

<style scoped>
.reel-viewport { height: 28px; overflow: hidden; position: relative; }
.reel-track { will-change: transform; transition: none; }
.reel-item { height: 28px; line-height: 28px; font-size: 1rem; }
@media (prefers-reduced-motion: reduce) {
  .reel-track { transition: none; }
}
</style>
