<template>
  <DialogShell variant="bottom" layer="sheet" labelledby="result-sheet-title" initial-focus='[data-testid="result-again"]' backdrop-testid="result-sheet-backdrop" class="sheet" @close="finish('done')">
      <div v-if="confetti" class="confetti" aria-hidden="true" data-testid="confetti">
        <span v-for="p in pieces" :key="p.i" class="confetti-piece" :style="p.style"></span>
      </div>

      <h2 id="result-sheet-title" class="sheet-title">{{ summary.isPb ? 'Neuer Bestwert!' : 'Gespeichert' }}</h2>
      <p class="muted sheet-drill">{{ drillTitle }}</p>

      <p class="sheet-value" data-testid="result-value">{{ fmtNumber(summary.value) }}</p>
      <p class="muted sheet-unit">{{ summary.unit }}</p>

      <div class="chip-row">
        <LevelStars v-if="summary.level !== null" :level="summary.level" compact data-testid="result-stars" />
        <span v-if="summary.isPb" class="chip chip-pb" data-testid="result-pb">PB</span>
      </div>
      <p v-if="summary.nextText" class="sheet-line" data-testid="result-next">{{ summary.nextText }}</p>

      <ul class="sheet-compare" data-testid="result-compare">
        <li v-if="summary.best !== null">Bestwert vorher: <strong>{{ fmtNumber(summary.best) }}</strong> <span class="muted">({{ signed(summary.bestDelta!) }})</span></li>
        <li v-if="summary.average !== null">Ø letzte {{ Math.min(5, previousCount) }}: <strong>{{ fmtNumber(summary.average) }}</strong> <span class="muted">({{ signed(summary.averageDelta!) }})</span></li>
        <li v-if="summary.best === null" class="muted">Das ist dein erstes Ergebnis in diesem Drill.</li>
      </ul>

      <label class="label" for="result-note">Notiz (optional)</label>
      <textarea id="result-note" v-model.trim="note" class="input" rows="2" placeholder="Was hat gut funktioniert?" data-testid="result-note"></textarea>

      <div class="sheet-actions">
        <button type="button" class="btn btn-primary" data-testid="result-again" @click="finish('again')">Nochmal</button>
        <button type="button" class="btn" data-testid="result-next-drill" @click="finish('next')">{{ nextLabel }}</button>
        <button type="button" class="btn" data-testid="result-done" @click="finish('done')">Fertig</button>
      </div>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import LevelStars from '@/components/LevelStars.vue'
import { fmtNumber, type ResultSummary } from '@/session/summary'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  summary: ResultSummary
  drillTitle: string
  previousCount?: number
  nextLabel?: string
}>(), { previousCount: 0, nextLabel: 'Nächster Drill' })

const emit = defineEmits<(e: 'again' | 'next' | 'done', note: string) => void>()

const note = ref('')

function reducedMotion(): boolean {
  try { return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

// confetti only for a personal best and never with reduced motion
const confetti = computed(() => props.summary.isPb && !reducedMotion())
const COLORS = ['#01593d', '#4FBF86', '#A7D8FF', '#E8DCC4', '#F2C94C']
const pieces = Array.from({ length: 28 }, (_, i) => ({
  i,
  style: {
    left: `${(i * 37) % 100}%`,
    background: COLORS[i % COLORS.length],
    animationDelay: `${(i % 7) * 70}ms`,
    animationDuration: `${1300 + (i % 5) * 150}ms`,
    transform: `rotate(${(i * 53) % 360}deg)`,
  },
}))

function finish(kind: 'again' | 'next' | 'done') {
  emit(kind, note.value)
}

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${fmtNumber(Math.abs(n))}`

</script>

<style scoped>
.sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.sheet-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
}

.sheet-drill,
.sheet-unit {
  margin: 0;
  text-align: center;
}

.sheet-value {
  margin: 4px 0 0;
  text-align: center;
  font-size: 3.4rem;
  font-weight: 800;
  line-height: 1;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.chip-pb {
  background: color-mix(in oklab, var(--primary) 15%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.sheet-line {
  margin: 0;
  text-align: center;
  font-weight: 700;
}

.sheet-compare {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.95rem;
}

.sheet-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -12px;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  animation-name: fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes fall {
  to {
    transform: translateY(420px) rotate(540deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }
}
</style>
