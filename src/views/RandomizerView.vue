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

          <!-- Reel: Environment -->
          <div class="reel">
            <div class="reel-label">Umgebung</div>
            <output class="reel-viewport" :aria-live="spinning.env ? 'off' : 'polite'">
              <div class="reel-track" :style="envTransformStyle">
                <div v-for="e in (envList.length ? envList : envItems)" :key="`env-${e}`" class="reel-item">{{ e }}
                </div>
              </div>
              <div class="reel-fade top" aria-hidden="true"></div>
              <div class="reel-fade bottom" aria-hidden="true"></div>
            </output>
          </div>

          <!-- Divider -->
          <div class="reel-divider" aria-hidden="true"></div>

          <!-- Reel: Focus -->
          <div class="reel">
            <div class="reel-label">Fokus</div>
            <output class="reel-viewport" :aria-live="spinning.focus ? 'off' : 'polite'">
              <div class="reel-track" :style="focusTransformStyle">
                <div v-for="f in (focusList.length ? focusList : focusItems)" :key="`focus-${f}`" class="reel-item">{{ f
                  }}</div>
              </div>
              <div class="reel-fade top" aria-hidden="true"></div>
              <div class="reel-fade bottom" aria-hidden="true"></div>
            </output>
          </div>

          <!-- Divider -->
          <div class="reel-divider" aria-hidden="true"></div>

          <!-- Reel: Name -->
          <div class="reel">
            <div class="reel-label">Zeitfenster</div>
            <output class="reel-viewport" :aria-live="spinning.title ? 'off' : 'polite'">
              <div class="reel-track" :style="nameTransformStyle">
                <div v-for="t in (nameList.length ? nameList : nameItems)" :key="`title-${t}`" class="reel-item">{{ t }}
                </div>
              </div>
              <div class="reel-fade top" aria-hidden="true"></div>
              <div class="reel-fade bottom" aria-hidden="true"></div>
            </output>
          </div>
        </div>

        <!-- Helper row -->
        <div class="slot-controls">
          <div class="hint" v-if="showCandidateHint">Mögliche Drills: {{ candidateCount }}</div>
          <label class="chip pref">
            <input type="checkbox" v-model="biasFavorites" :disabled="!hasAnyFavorites" data-testid="bias-favorites" />
            Favoriten bevorzugen
          </label>
          <div class="actions">
            <button class="lever btn-primary" type="button" :disabled="disabled || running" @click="start"
              data-testid="shuffle-start">
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
/* == LOGIK UNVERÄNDERT (nur minimale Style-Hooks) == */
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps<{ durationEnvMs?: number; durationFocusMs?: number; durationNameMs?: number }>()
const D_ENV = computed(() => props.durationEnvMs ?? 550)
const D_FOCUS = computed(() => props.durationFocusMs ?? 650)
const D_NAME = computed(() => props.durationNameMs ?? 500)

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

// type Environment = string'Putting Green' | 'Chipping Green' | 'Pitching Green' | 'Driving Range' | 'Bunker' | 'Platz'
// type Focus =
//   | 'Längenkontrolle' | 'Breaklesen' | 'Druck' | 'Zielspiel'
//   | 'Ballstriking' | 'Speed/Pace' | 'Balance/Finish' | 'Strategie'
//   | 'Shaping' | 'Routine/Konstanz' | 'Up & Down' | 'Stats/Analyse'
// type TimeBucket = '5–7 min' | '8–10 min' | '11–15 min' | '16–25 min' | '25+ min'

interface DerivedDrill {
  id: string
  title: string
  environment: string
  focuses: string[]
  favorite: boolean
  rawCategory?: string
}

const derived = computed<DerivedDrill[]>(() => {
  return catalog.drills.map((d: any) => {
    const env: string = d?.setup?.location ?? 'Unbekannt'
    const tags: string[] = Array.isArray(d?.tags) ? d.tags : []
    return {
      id: d.id,
      title: d.title,
      environment: env,
      focuses: tags,        // unverändert übernehmen
      favorite: isFavorite(d.id),
    }
  })
})

//const envItems = computed<string[]>(() => Array.from(new Set(derived.value.map(d => d.environment))))
const envItems = computed<string[]>(() => {
  const s = new Set<string>()
  for (const d of catalog.drills) {
    const loc = (d as any)?.setup?.location?.trim()
    if (loc) s.add(loc)
  }
  // hübsch sortieren (de)
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'))
})

const focusItems = computed<string[]>(() => {
  const s = new Set<string>()
  for (const d of catalog.drills) {
    const tags: string[] = (d as any)?.tags ?? []
    for (const t of tags) {
      const norm = String(t).trim()
      if (norm) s.add(norm)
    }
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'))
})

const nameItems = computed<string[]>(() => {
  const s = new Set<string>()
  for (const d of catalog.drills) {
    const title = (d as any)?.title?.trim()
    if (title) s.add(title)
  }
  // hübsch sortieren (de)
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'))
})

function rnd(): number {
  if (globalThis.crypto?.getRandomValues) { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return (a[0] / 0xFFFFFFFF); }
  return Math.random();
}
function randInt(n: number) { return Math.floor(rnd() * n); }
function shuffleInPlace<T>(arr: T[]): T[] { for (let i = arr.length - 1; i > 0; i--) { const j = randInt(i + 1);[arr[i], arr[j]] = [arr[j], arr[i]] } return arr }
function sampleWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0); let r = rnd() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
  return items[items.length - 1]
}
const lastPick = new Map<string, string>()
function pickNoRepeat(key: string, values: string[]): string {
  if (values.length <= 1) return values[0] ?? '—'
  const last = lastPick.get(key)
  const candidates = values.filter(v => v !== last)
  const v = candidates[randInt(candidates.length)]
  lastPick.set(key, v)
  return v
}

/* — Reel visuals/state — */
const itemHeight = 48 // GRÖSSER für Slot-Optik
const envOffset = ref(0), focusOffset = ref(0), nameOffset = ref(0)
const envTransformStyle = computed(() => ({ transform: `translateY(${-envOffset.value}px)` }))
const focusTransformStyle = computed(() => ({ transform: `translateY(${-focusOffset.value}px)` }))
const nameTransformStyle = computed(() => ({ transform: `translateY(${-nameOffset.value}px)` }))

const envList = ref<string[]>([])
const focusList = ref<string[]>([])
const nameList = ref<string[]>([])

const display = reactive<{ env: string | null; focus: string | null; title: string | null }>({ env: null, focus: null, title: null })
const spinning = reactive({ env: false, focus: false, title: false })
const running = ref(false)
let rafIds: any[] = []
function clearTimers() {
  for (const r of rafIds) {
    cancelAnimationFrame(r);
  }
  rafIds = [];
}

function spinToIndex(itemsLen: number, offsetRef: { value: number }, targetIndex: number, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (itemsLen <= 0) { resolve(); return }
    const total = itemsLen * itemHeight
    const extraLoops = 3 + randInt(3)
    const start = performance.now()
    const startOffset = offsetRef.value % total
    const currentIndex = Math.round(startOffset / itemHeight) % itemsLen
    const forwardSteps = (extraLoops * itemsLen) + ((targetIndex - currentIndex + itemsLen) % itemsLen)
    const targetOffset = startOffset + forwardSteps * itemHeight
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = easeOutCubic(t)
      offsetRef.value = startOffset + (targetOffset - startOffset) * eased
      if (t < 1) rafIds.push(requestAnimationFrame(tick)); else { offsetRef.value = targetOffset % total; resolve() }
    }
    rafIds.push(requestAnimationFrame(tick))
  })
}

function candidates(env: string | null, focus: string | null, title: string | null): DerivedDrill[] {
  let list = derived.value
  if (env) list = list.filter(d => d.environment === env)
  if (focus) list = list.filter(d => d.focuses.includes(focus))
  if (title) list = list.filter(d => d.title === title)
  return list
}
const candidateCount = computed(() => candidates(display.env, display.focus, display.title).length)
const showCandidateHint = computed(() => !running.value && !!display.env && !!display.focus && !!display.title)

function chooseDrillId(pool: { id: string; favorite: boolean }[]): string {
  if (pool.length === 0) return ''
  const favFactor = pool.length <= 3 ? 2 : 3
  const weights = pool.map(d => (biasFavorites.value && d.favorite ? favFactor : 1))
  let chosen = sampleWeighted(pool, weights)
  const last = lastPick.get('drill')
  if (last && pool.length > 1 && chosen.id === last) {
    const alt = pool.find(p => p.id !== last) ?? chosen
    chosen = alt
  }
  lastPick.set('drill', chosen.id)
  return chosen.id
}

async function start() {
  if (disabled.value || running.value) return
  running.value = true
  clearTimers()
  envOffset.value = focusOffset.value = nameOffset.value = 0
  display.env = display.focus = display.title = null
  spinning.env = spinning.focus = spinning.title = false

  envList.value = shuffleInPlace([...envItems.value])
  focusList.value = shuffleInPlace([...focusItems.value])
  nameList.value = shuffleInPlace([...nameItems.value])

  const targetEnv = pickNoRepeat('env', envList.value)
  const targetFocus = pickNoRepeat('focus', focusList.value)
  const targetName = pickNoRepeat('title', nameList.value)
  const envIdx = Math.max(0, envList.value.indexOf(targetEnv))
  const focIdx = Math.max(0, focusList.value.indexOf(targetFocus))
  const nameIdx = Math.max(0, nameList.value.indexOf(targetName))

  if (prefersReducedMotion()) {
    display.env = envList.value[envIdx] ?? null
    display.focus = focusList.value[focIdx] ?? null
    display.title = nameList.value[nameIdx] ?? null
    return finish()
  }

  spinning.env = true; await spinToIndex(envList.value.length, envOffset, envIdx, D_ENV.value); spinning.env = false; display.env = envList.value[envIdx] ?? null
  spinning.focus = true; await spinToIndex(focusList.value.length, focusOffset, focIdx, D_FOCUS.value); spinning.focus = false; display.focus = focusList.value[focIdx] ?? null
  spinning.title = true; await spinToIndex(nameList.value.length, nameOffset, nameIdx, D_NAME.value); spinning.title = false; display.title = nameList.value[nameIdx] ?? null

  finish()
}

function cancel() { running.value = false; clearTimers(); spinning.env = spinning.focus = spinning.title = false }

function finish() {
  running.value = false
  const env = display.env, focus = display.focus, title = display.title
  let pool = candidates(env, focus, title)
  if (pool.length === 0 && env && focus && title) { if (rnd() < 0.5) pool = candidates(env, focus, null); else pool = candidates(env, null, title) }
  if (pool.length === 0 && env) pool = candidates(env, null, null)
  if (pool.length === 0) pool = derived.value
  if (!pool.length) return
  const chosenId = chooseDrillId(pool.map(p => ({ id: p.id, favorite: p.favorite })))
  const original = catalog.drills.find(x => x.id === chosenId)
  if (original) {
    try {
      ; (globalThis as any).__lastPushedRoute = { name: 'DrillDetail', id: original.id }
      const p = router.push({ name: 'DrillDetail', params: { id: original.id } })
      p.finally(() => { try { ui.setShuffle(false) } catch { } })
    } catch (e) { console.error('Failed to navigate to drill detail:', e) }
  }
}

function close() {
  if (ui.shuffleOpen) { ui.setShuffle(false); return }
  router.back()
}
onBeforeUnmount(() => clearTimers())
watch([derived, () => display.env, () => display.focus, () => display.title], () => { /* computed only */ })
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
  display: grid;
  grid-template-columns: 1fr 10px 1fr 10px 1fr;
  align-items: center;
  gap: 0;
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

.hint {
  font-size: .9rem;
  color: #6b7280;
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

/* Accessibility: reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reel-track {
    transition: none;
  }
}
</style>
