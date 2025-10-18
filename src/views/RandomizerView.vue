<template>
  <section class="row">
    <!-- Filter -->
    <div class="card" style="flex:1 1 260px;">
      <h2 style="margin:0 0 8px 0;">Zufallsgenerator</h2>

      <div class="row">
        <div class="field" style="min-width:180px; flex:1">
          <label class="label">Kategorie</label>
          <select class="input" v-model="category" :disabled="isShuffling">
            <option value="">Alle</option>
            <option value="chipping">Chipping</option>
            <option value="putting">Putting</option>
            <option value="driving">Driving</option>
            <option value="irons">Irons</option>
            <option value="bunker">Bunker</option>
          </select>
        </div>

        <div class="field" style="min-width:220px; flex:1;">
          <label class="label">Tags</label>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <label v-for="t in uniqueTags" :key="t" class="chip" style="cursor:pointer;">
              <input type="checkbox" :value="t" v-model="tagsAny" style="margin-right:6px" :disabled="isShuffling" />
              {{ t }}
            </label>
          </div>
        </div>

        <div class="field" style="min-width:160px;">
          <label class="label">Max. Schwierigkeit</label>
          <input class="input" type="number" min="1" max="5" v-model.number="maxDifficulty" :disabled="isShuffling" />
        </div>

        <div class="field" style="align-self:flex-end; display:flex; gap:8px;">
          <button class="btn btn-primary" @click="roll" :disabled="isShuffling || pool().length === 0">
            <span v-if="!isShuffling">Ziehen</span>
            <span v-else>Shuffling…</span>
          </button>
          <button class="btn" type="button" @click="resetFilters" :disabled="isShuffling">Filter löschen</button>
        </div>
      </div>

      <p v-if="error" style="color:var(--muted); margin:.5rem 0 0;">{{ error }}</p>
    </div>

    <!-- Ergebnis / Slot-Machine -->
    <article class="card" style="flex:2 1 340px;">
      <!-- Slot-Window -->
      <div class="slot" :class="{ 'slot--active': isShuffling }" v-if="pool().length">
        <div class="reel" :class="{ spinning: isShuffling }">{{ reel1 }}</div>
        <div class="reel" :class="{ spinning: isShuffling }" style="animation-delay:.05s">{{ reel2 }}</div>
        <div class="reel" :class="{ spinning: isShuffling }" style="animation-delay:.1s">{{ reel3 }}</div>
      </div>

      <!-- Details (nach Stopp sichtbar) -->
      <template v-if="display && !isShuffling">
        <h3 style="margin:8px 0 0;">{{ display.title }}</h3>
        <p class="chip" style="display:inline-block; margin-top:6px;">★ {{ display.difficulty ?? 3 }}</p>
        <p style="color:var(--muted); margin:.5rem 0 0">
          <strong>Kategorie:</strong> {{ display.category }} ·
          <strong>Dauer:</strong> {{ display.durationMin ?? '—' }} Min
        </p>
        <p style="margin:.5rem 0 0">{{ display.description }}</p>
        <div v-if="display.tags?.length" class="chips" style="margin-top:8px;">
          <span class="chip" v-for="t in display.tags" :key="t">{{ t }}</span>
        </div>
      </template>

      <template v-else-if="!pool().length && !isShuffling">
        <h3 style="margin:0;">Noch nichts gezogen</h3>
        <p style="color:var(--muted);">Lege Drills an oder passe die Filter an.</p>
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDrillStore } from '@/stores/drills'
import type { Drill, DrillCategory } from '@/types/drill'

const store = useDrillStore()

// UI-State
const isShuffling = ref(false)
const error = ref<string | null>(null)

// Filter
const category = ref<'' | DrillCategory>('')
const maxDifficulty = ref<number | null>(null)
const tagsAny = ref<string[]>([])
const tagsAll = ref<string[]>([])

const uniqueTags = computed(() => {
  const set = new Set<string>()
  for (const d of store.drills) (d.tags ?? []).forEach(t => set.add(t))
  return [...set].sort((a, b) => a.localeCompare(b))
})

// Ergebnis
const display = ref<Drill | null>(null)
const result = ref<Drill | null>(null)

// Slot-Reels (zeigen Titel)
const reel1 = ref('—')
const reel2 = ref('—')
const reel3 = ref('—')

// Timer
let t1: number | null = null
let t2: number | null = null
let t3: number | null = null

onMounted(async () => { await store.load() })
onBeforeUnmount(stopAll)

function pool(): Drill[] {
  let p = [...store.drills]
  if (category.value) p = p.filter(d => d.category === category.value)
  if (maxDifficulty.value != null) p = p.filter(d => (d.difficulty ?? 3) <= (maxDifficulty.value as number))
  if (tagsAny.value.length > 0) p = p.filter(d => (d.tags ?? []).some(t => tagsAny.value.includes(t)))
  if (tagsAll.value.length > 0) p = p.filter(d => tagsAll.value.every(t => (d.tags ?? []).includes(t)))
  return p
}

function resetFilters() {
  category.value = ''
  tagsAny.value = []
  tagsAll.value = []
  maxDifficulty.value = null
}

function roll() {
  if (isShuffling.value) return
  const p = pool()
  error.value = null
  if (p.length === 0) {
    display.value = null
    result.value = null
    error.value = 'Keine passenden Drills. Filter anpassen oder neue Drills anlegen.'
    return
  }

  // Vorbereiten
  isShuffling.value = true
  result.value = p[Math.floor(Math.random() * p.length)]         // finaler Gewinner
  const titles = p.map(d => d.title)

  // Startwerte in Reels
  reel1.value = pick(titles)
  reel2.value = pick(titles)
  reel3.value = pick(titles)

  // Drei Reels mit leicht versetzten Geschwindigkeiten/Stops
  // Spannender: Intervalle werden vor dem Stopp minimal langsamer.
  spinReel(1, titles, 70, 900, () => (reel1.value = result.value!.title))
  spinReel(2, titles, 65, 1100, () => (reel2.value = result.value!.title))
  spinReel(3, titles, 60, 1300, () => {
    reel3.value = result.value!.title
    display.value = result.value
    isShuffling.value = false
  })
}

function spinReel(idx: 1 | 2 | 3, titles: string[], startMs: number, totalMs: number, onStop: () => void) {
  let speed = startMs
  const decelEvery = 280   // alle X ms etwas langsamer
  const decelFactor = 1.18 // Verlangsamung
  let elapsed = 0

  // Initialer Ticker
  const tick = () => {
    const title = pick(titles)
    if (idx === 1) reel1.value = title
    if (idx === 2) reel2.value = title
    if (idx === 3) reel3.value = title
  }

  // eigenes Interval je Reel
  const startInterval = () => {
    const handle = window.setInterval(() => {
      elapsed += speed
      tick()

      // leichtes Auslaufen
      if (elapsed % decelEvery < speed) {
        speed = Math.min(speed * decelFactor, 220) // Deckel, damit’s nicht zu langsam wird
        // Interval „neu starten“ mit neuer speed
        clearInterval(handle)
        setTimer(idx, window.setInterval(() => {
          elapsed += speed
          tick()
          if (elapsed >= totalMs) finish()
        }, speed) as unknown as number)
      }

      if (elapsed >= totalMs) finish()
    }, speed) as unknown as number
    setTimer(idx, handle)
  }

  const finish = () => {
    clearTimer(idx)
    onStop()
  }

  startInterval()
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function setTimer(idx: 1 | 2 | 3, h: number) {
  if (idx === 1) t1 = h
  if (idx === 2) t2 = h
  if (idx === 3) t3 = h
}
function clearTimer(idx: 1 | 2 | 3) {
  if (idx === 1 && t1 != null) { clearInterval(t1); t1 = null }
  if (idx === 2 && t2 != null) { clearInterval(t2); t2 = null }
  if (idx === 3 && t3 != null) { clearInterval(t3); t3 = null }
}
function stopAll() { clearTimer(1); clearTimer(2); clearTimer(3) }
</script>

<style scoped>
/* Slot-Fenster */
.slot {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 92%, var(--bg));
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
}

/* leichte Kante oben/unten wie beim Automatenfenster */
.slot::before,
.slot::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  height: 18px;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(to bottom, rgba(0,0,0,.06), transparent);
}
.slot::before { top: 0; }
.slot::after  {
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,.06), transparent);
}

/* Einzelnes Sichtfenster */
.reel {
  height: 44px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  padding: 0 8px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: var(--shadow);
}

/* Vibration/Slot-Feeling während des Spins */
@keyframes jitter {
  0% { transform: translateY(0) }
  25% { transform: translateY(-1px) }
  50% { transform: translateY(0) }
  75% { transform: translateY(1px) }
  100% { transform: translateY(0) }
}
.spinning { animation: jitter .18s linear infinite; }
</style>
