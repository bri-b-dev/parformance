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
        <div class="row" style="align-items:center; justify-content:center; margin:10px 0;">
          <!-- Reel: Category -->
          <div class="card" style="min-width:220px; text-align:center;">
            <div class="label">Kategorie</div>
            <div class="text-lg" :aria-live="spinning.category ? 'off' : 'polite'" role="status">{{ display.category || '—' }}</div>
          </div>
          <!-- Reel: Drill -->
          <div class="card" style="min-width:260px; text-align:center;">
            <div class="label">Drill</div>
            <div class="text-lg" :aria-live="spinning.drill ? 'off' : 'polite'" role="status">{{ display.drill || '—' }}</div>
          </div>
          <!-- Reel: Target type (optional) -->
          <div class="card" style="min-width:200px; text-align:center;">
            <div class="label">Zieltyp</div>
            <div class="text-lg" :aria-live="spinning.target ? 'off' : 'polite'" role="status">{{ display.target || '—' }}</div>
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

// Display state
const display = reactive<{ category: string | null; drill: string | null; target: string | null }>({
  category: null,
  drill: null,
  target: null,
})

const selectedDrill = ref<Drill | null>(null)
const running = ref(false)

const spinning = reactive({ category: false, drill: false, target: false })
let timers: any[] = []
let intervals: any[] = []

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  for (const i of intervals) clearInterval(i)
  timers = []
  intervals = []
}

function cycle(list: string[], assign: (val: string) => void, intervalMs = 80) {
  if (!list.length) return
  let idx = 0
  assign(list[idx])
  const id = setInterval(() => {
    idx = (idx + 1) % list.length
    assign(list[idx])
  }, intervalMs)
  intervals.push(id)
  return { stop: () => clearInterval(id), getIndex: () => idx }
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
  clearTimers()

  // 1) Spin category
  const cats = categories.value
  spinning.category = true
  const catCtl = cycle(cats, v => (display.category = v))

  // Stop category after 600ms
  timers.push(setTimeout(() => {
    spinning.category = false
    catCtl?.stop()
    const chosenCat = display.category || cats[0]

    // 2) Spin drill within category
    const list = drillsFor(chosenCat)
    const drillTitles = list.map(d => d.title)
    spinning.drill = true
    const drillCtl = cycle(drillTitles, v => (display.drill = v))

    timers.push(setTimeout(() => {
      spinning.drill = false
      drillCtl?.stop()
      // Determine selected drill by title
      const title = display.drill || drillTitles[0]
      const d = list.find(x => x.title === title) || list[0]
      selectedDrill.value = d

      // 3) Spin target type (optional)
      const targetTypes = d?.metric?.type ? [String(d.metric.type)] : []
      if (targetTypes.length === 0) {
        display.target = null
      } else {
        spinning.target = true
        const tgtCtl = cycle(targetTypes, v => (display.target = v))
        timers.push(setTimeout(() => {
          spinning.target = false
          tgtCtl?.stop()
          finish()
        }, 500))
        return
      }

      // If no target reel, finish slightly later
      timers.push(setTimeout(() => finish(), 200))
    }, 700))
  }, 600))
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
