<template>
  <!-- Overlay backdrop -->
  <div v-if="isOpen" class="overlay" @click.self="close" role="dialog" aria-modal="true"
    aria-labelledby="shuffle-title">
    <div class="card overlay-panel slot-panel" role="document">
      <header class="slot-header">
        <h2 id="shuffle-title">Zufallsauswahl</h2>
        <!-- X entfernt -->
      </header>

      <!-- Loading / Error -->
      <output v-if="!catalog.loaded" class="loading" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        Lädt…
      </output>
      <output v-else-if="catalog.error" class="error" aria-live="polite">
        {{ catalog.error }}
      </output>

      <!-- Content -->
      <div v-else class="slot-body">
        <!-- Slot frame -->
        <div class="slot-frame">
          <!-- Center marker line -->
          <div class="slot-marker" aria-hidden="true"></div>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="slot in reelOrder" :key="slot" class="min-w-0">
              <Reel :items="nameItems" label="Drill" :spinTrigger="spinTick[slot]" :duration="D_NAME"
                :targetValue="targetTitle || undefined" @stopped="(v) => onReelStopped(slot, v)" />
            </div>
          </div>
        </div>

        <div class="slot-result" v-if="displayTitle">
          <span class="slot-result-label">Gewählt:</span>
          <span class="slot-result-value">{{ displayTitle }}</span>
        </div>

        <!-- Helper row -->
        <div class="slot-controls">
          <label class="chip pref">
            <input type="checkbox" v-model="biasFavorites" :disabled="!hasAnyFavorites" data-testid="bias-favorites" />
            Favoriten bevorzugen
          </label>
          <div class="actions">
            <button ref="leverRef" class="lever btn-primary" type="button" :disabled="disabled || running"
              @click="onLeverClick">
              <span class="lever-knob" aria-hidden="true"></span>
              <span class="lever-text">Start</span>
            </button>

            <button class="btn ghost" type="button" :disabled="!running" @click="cancel"
              data-testid="shuffle-cancel">Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useUiStore } from '@/stores/ui'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Reel from '@/components/Reel.vue'

const props = defineProps<{ durationNameMs?: number }>()
const D_NAME = computed(() => props.durationNameMs ?? 650)

function prefersReducedMotion(): boolean {
  try { return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

const catalog = useDrillCatalogStore()
const favorites = useFavoritesStore()
const router = useRouter()
const route = useRoute()
const ui = useUiStore()
const isOpen = computed(() => !!(ui.shuffleOpen || route.name === 'ShuffleOverlay'))

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
  if (!favorites.loaded) await favorites.load()
  const q = route?.query || {}
  const favOn = ['1', 'true', 'yes'].includes(String((q as any).fav ?? (q as any).onlyFavorites ?? '').toLowerCase())
  if (favOn && hasAnyFavorites.value) biasFavorites.value = true
})

const disabled = computed(() => (catalog.drills.length === 0))
const hasAnyFavorites = computed(() => (favorites.list?.length ?? 0) > 0)
const biasFavorites = ref<boolean>(false)
const isFavorite = (id: string) => favorites.list?.includes?.(id) ?? false

interface DerivedDrill {
  id: string
  title: string
  favorite: boolean
}

const derived = computed<DerivedDrill[]>(() => {
  return catalog.drills
    .map((d: any) => ({
      id: d.id,
      title: String(d?.title ?? '').trim(),
      favorite: isFavorite(d.id),
    }))
    .filter((d) => !!d.title)
})

const nameItems = computed<string[]>(() => {
  const s = new Set<string>()
  for (const d of derived.value) {
    if (d.title) s.add(d.title)
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'))
})

function rnd(): number {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1)
    globalThis.crypto.getRandomValues(a)
    return (a[0] / 0xFFFFFFFF)
  }
  return Math.random()
}

function sampleWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

const lastPick = new Map<string, string>()

function chooseDrillId(pool: { id: string; favorite: boolean }[]): string {
  if (pool.length === 0) return ''
  const favFactor = pool.length <= 3 ? 2 : 3
  const weights = pool.map((d) => (biasFavorites.value && d.favorite ? favFactor : 1))
  let chosen = sampleWeighted(pool, weights)
  const last = lastPick.get('drill')
  if (last && pool.length > 1 && chosen.id === last) {
    const alt = pool.find((p) => p.id !== last) ?? chosen
    chosen = alt
  }
  lastPick.set('drill', chosen.id)
  return chosen.id
}

const leverRef = ref<HTMLButtonElement | null>(null)

function onLeverClick() {
  const el = leverRef.value
  if (el) {
    el.classList.remove('wobble')
    void el.offsetWidth
    el.classList.add('wobble')
    el.addEventListener('animationend', () => el.classList.remove('wobble'), { once: true })
  }
  start()
}

const reelOrder = ['left', 'center', 'right'] as const
type SlotKey = typeof reelOrder[number]

const spinTick = reactive<Record<SlotKey, number>>({ left: 0, center: 0, right: 0 })
const spinning = reactive<Record<SlotKey, boolean>>({ left: false, center: false, right: false })
const targetTitle = ref<string | null>(null)
const displayTitle = ref<string | null>(null)
const running = ref(false)
const selectedDrillId = ref<string | null>(null)
let spinResolver: (() => void) | null = null

async function start() {
  if (disabled.value || running.value) return
  running.value = true
  displayTitle.value = null
  targetTitle.value = null
  selectedDrillId.value = null
  reelOrder.forEach((slot) => {
    spinning[slot] = false
  })

  const pool = derived.value
  if (!pool.length) {
    running.value = false
    return
  }

  const chosenId = chooseDrillId(pool.map((p) => ({ id: p.id, favorite: p.favorite })))
  if (!chosenId) {
    running.value = false
    return
  }

  const original = catalog.drills.find((x) => x.id === chosenId)
  const chosenTitle = (original?.title ?? pool.find((p) => p.id === chosenId)?.title ?? '').trim()
  if (!chosenTitle) {
    running.value = false
    return
  }

  selectedDrillId.value = chosenId
  targetTitle.value = chosenTitle

  if (prefersReducedMotion()) {
    displayTitle.value = chosenTitle
    running.value = false
    finish()
    return
  }

  const waitForSpin = new Promise<void>((resolve) => {
    spinResolver = resolve
  })
  reelOrder.forEach((slot) => {
    spinning[slot] = true
    spinTick[slot]++
  })

  await waitForSpin
  spinResolver = null

  if (!selectedDrillId.value || !targetTitle.value) {
    running.value = false
    return
  }

  displayTitle.value = targetTitle.value
  running.value = false
  finish()
}

function onReelStopped(slot: SlotKey, _value: string) {
  spinning[slot] = false
  if (!spinResolver) return
  if (!spinning.left && !spinning.center && !spinning.right) {
    const resolver = spinResolver
    spinResolver = null
    resolver()
  }
}

function cancel() {
  if (!running.value) return
  running.value = false
  targetTitle.value = null
  selectedDrillId.value = null
  displayTitle.value = null
  reelOrder.forEach((slot) => {
    spinning[slot] = false
  })
  if (spinResolver) {
    const resolver = spinResolver
    spinResolver = null
    resolver()
  }
}

function finish() {
  const id = selectedDrillId.value
  if (!id) return
  const original = catalog.drills.find((x) => x.id === id)
  if (!original) return
  running.value = false
  try {
    ; (globalThis as any).__lastPushedRoute = { name: 'DrillDetail', id: original.id }
    const p = router.push({ name: 'DrillDetail', params: { id: original.id } })
    p.finally(() => {
      try { ui.setShuffle(false) } catch { }
    })
  } catch (e) {
    console.error('Failed to navigate to drill detail:', e)
  }
}

function close() {
  if (ui.shuffleOpen) {
    ui.setShuffle(false)
    return
  }
  router.back()
}
</script>

<style scoped>
/* Overlay/backdrop */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1100;
  padding: 20px;
}

.overlay-panel {
  width: min(980px, 96vw);
  max-height: 92vh;
  overflow: auto;
  border-radius: 16px;
  padding: 18px;
}

/* Slot look & feel */
.slot-panel {
  background: var(--surface, #fff);
  box-shadow: 0 12px 38px rgba(0, 0, 0, 0.22);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.slot-header h2 {
  margin: 0;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: .2px;
}

/* Loading + error */
.loading,
.error {
  padding: 16px;
  font-size: .95rem;
  color: var(--text, #444C56);
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  border-top-color: #2F7A52;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* SLOT FRAME */
.slot-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slot-frame {
  position: relative;
  align-items: center;
  padding: 18px;
  border-radius: 18px;
  background:
    radial-gradient(120% 140% at 50% 0%, rgba(255, 255, 255, 0.90), rgba(240, 244, 242, 0.80) 60%, rgba(230, 235, 233, 0.85)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(225, 230, 227, 0.65));
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.8),
    inset 0 -2px 8px rgba(0, 0, 0, 0.08),
    0 6px 22px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.slot-result {
  margin: 10px 0 4px;
  text-align: center;
  color: var(--text, #444C56);
}

.slot-result-label {
  display: inline-block;
  margin-right: 6px;
  font-size: .75rem;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: #6b7280;
}

.slot-result-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.slot-marker {
  position: absolute;
  left: 18px;
  right: 18px;
  top: 50%;
  height: 0;
  border-top: 2px solid rgba(47, 122, 82, 0.55);
  box-shadow: 0 0 0 1px rgba(47, 122, 82, 0.08);
  transform: translateY(-50%);
  pointer-events: none;
}

.reel-divider {
  width: 10px;
  height: 100%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.02));
  border-radius: 6px;
  box-shadow: inset -1px 0 rgba(255, 255, 255, 0.7), inset 1px 0 rgba(0, 0, 0, 0.05);
}

/* REEL */
.reel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.reel-label {
  font-size: .8rem;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: .2px;
}

.reel-viewport {
  position: relative;
  height: 48px;
  /* Sichtfenster = itemHeight */
  overflow: hidden;
  min-width: 240px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f4f7f6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.reel-track {
  will-change: transform;
  transition: none;
}

.reel-item {
  height: 48px;
  line-height: 48px;
  font-size: 1.06rem;
  font-weight: 600;
  color: var(--text, #444C56);
  text-align: center;
  white-space: nowrap;
  padding: 0 12px;
}

/* Fade masks oben/unten */
.reel-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 18px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0));
}

.reel-fade.top {
  top: 0;
}

.reel-fade.bottom {
  bottom: 0;
  transform: rotate(180deg);
}

/* CONTROLS */
.slot-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 4px 2px;
}

.pref {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: .9rem;
  color: #46505b;
}

.pref input {
  transform: translateY(1px);
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}

.btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.btn.ghost {
  background: #fff;
}

.btn-primary {
  background: var(--primary, #2F7A52);
  color: var(--primary-ink, #fff);
  border: none;
}

/* Hebel-Button */
.lever {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px 12px 14px;
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(47, 122, 82, 0.28), inset 0 1px 0 rgba(255, 255, 255, .2);
}

.lever-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, .1), 0 2px 6px rgba(0, 0, 0, .25);
}

.lever-text {
  font-weight: 800;
  letter-spacing: .2px;
}

/* sanftes Wippen: kurz runterdrücken, minimal overshoot, settle */
.lever.wobble {
  animation: lever-wobble 320ms cubic-bezier(.2, .8, .3, 1) both;
}

@keyframes lever-wobble {
  0% {
    transform: translateY(0) scale(1);
  }

  28% {
    transform: translateY(3px) scale(.985);
  }

  58% {
    transform: translateY(-1px) scale(1.008);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

/* Accessibility: reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reel-track {
    transition: none;
  }
}
</style>
