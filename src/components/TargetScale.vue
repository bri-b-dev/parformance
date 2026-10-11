<template>
  <section class="ts" aria-labelledby="ts-title" data-testid="target-scale">
    <header class="ts-head">
      <h3 id="ts-title" class="ts-title">Zielwerte</h3>
      <div v-if="hasTarget" class="ts-toggle" role="radiogroup" aria-label="Zielwerte für">
        <button type="button" role="radio" class="ts-opt" :class="{ on: mode === 'mine' }" :aria-checked="mode === 'mine'" data-testid="ts-mine" @click="mode = 'mine'">
          Mein HCP<template v-if="currentHcp !== null"> ({{ formatHcp(currentHcp) }})</template>
        </button>
        <button type="button" role="radio" class="ts-opt" :class="{ on: mode === 'target' }" :aria-checked="mode === 'target'" data-testid="ts-target" @click="mode = 'target'">
          Ziel-HCP ({{ formatHcp(settings.targetHcp) }})
        </button>
      </div>
    </header>

    <p v-if="!activeHcp" class="muted ts-missing" data-testid="ts-missing">
      Trage dein Handicap ein, um die Zielwerte für dich zu sehen.
      <button type="button" class="btn" @click="ui.setSettings(true)">Handicap eintragen</button>
    </p>
    <p v-else-if="!model" class="muted" data-testid="ts-none">Für dieses Handicap gibt es keine Zielwerte.</p>

    <template v-else>
      <!-- the picture; the same information is available as text below -->
      <div class="ts-scale" aria-hidden="true" data-testid="ts-scale">
        <div class="ts-track">
          <div v-if="model.bestPos !== null" class="ts-fill" :style="{ width: pct(model.bestPos) }"></div>
          <div v-for="m in model.markers" :key="m.level" class="ts-marker" :class="{ goal: mode === 'target' && m.level === 2 }" :style="{ left: pct(m.pos) }" :data-testid="`ts-marker-${m.level}`">
            <span class="ts-star">{{ '★'.repeat(m.level) }}</span>
            <span class="ts-tick"></span>
            <span class="ts-val">{{ fmtNumber(m.value) }}</span>
          </div>
          <div v-if="model.lastPos !== null && lastDiffers" class="ts-last" :style="{ left: pct(model.lastPos) }" data-testid="ts-last" title="Letztes Ergebnis"></div>
          <div v-if="model.bestPos !== null" class="ts-best" :style="{ left: pct(model.bestPos) }" data-testid="ts-best" title="Bestwert">▲</div>
        </div>
      </div>

      <p class="ts-status" aria-live="polite" data-testid="ts-status">{{ status }}</p>
      <p class="muted ts-thresholds" data-testid="ts-thresholds">{{ thresholdsLine }}</p>
    </template>

    <details class="ts-all" :open="!activeHcp">
      <summary>Alle HCP-Bereiche</summary>
      <HcpTargetsTable :drill="drill" hide-missing />
    </details>
  </section>
</template>

<script setup lang="ts">
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { resolveThresholds } from '@/hcp/buckets'
import { formatHcp } from '@/hcp/format'
import { buildScale } from '@/hcp/scale'
import { fmtNumber, isSmallerBetter } from '@/session/summary'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import type { Drill } from '@/types'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{ drill: Drill }>()

const sessions = useSessionsStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { hcp: currentHcp } = useCurrentHcp()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
})

const mode = ref<'mine' | 'target'>('mine')
const hasTarget = computed(() => settings.targetHcp !== null)
// without a target HCP only "mine" exists
const activeHcp = computed(() => (mode.value === 'target' && hasTarget.value ? settings.targetHcp : currentHcp.value))

const smaller = computed(() => isSmallerBetter(props.drill))
const values = computed(() => sessions.listByDrill(props.drill.id).map(s => Number(s.result?.value)).filter(Number.isFinite))
const best = computed<number | null>(() => (values.value.length ? values.value.reduce((b, v) => ((smaller.value ? v < b : v > b) ? v : b)) : null))
const last = computed<number | null>(() => values.value[0] ?? null) // sessions come newest first
const lastDiffers = computed(() => last.value !== null && last.value !== best.value)

const thresholds = computed(() => (activeHcp.value === null ? [] : resolveThresholds(props.drill.metric.hcpTargets, activeHcp.value)))
const model = computed(() => buildScale({ thresholds: thresholds.value, smallerIsBetter: smaller.value, best: best.value, last: last.value }))

const pct = (p: number) => `${Math.round(p * 1000) / 10}%`
const cmp = computed(() => (smaller.value ? 'bis' : 'ab'))
const sign = computed(() => (smaller.value ? '−' : '+'))

const thresholdsLine = computed(() => {
  const m = model.value
  if (!m) return ''
  const hcp = formatHcp(activeHcp.value)
  return `Bei HCP ${hcp}: ${m.markers.map(x => `${'★'.repeat(x.level)} ${cmp.value} ${fmtNumber(x.value)}`).join(' · ')}`
})

/** One line with the threshold of the next level (or the goal) and the distance. */
const status = computed(() => {
  const m = model.value
  if (!m) return ''
  const b = best.value
  if (mode.value === 'target') {
    const goal = m.markers.find(x => x.level === 2) ?? m.markers[m.markers.length - 1]
    if (b === null) return `Ziel bei HCP ${formatHcp(settings.targetHcp)}: ${'★'.repeat(goal.level)} ${cmp.value} ${fmtNumber(goal.value)}. Noch kein Ergebnis.`
    const gap = smaller.value ? b - goal.value : goal.value - b
    return gap <= 0
      ? `Ziel erreicht: dein Bestwert ${fmtNumber(b)} liegt ${cmp.value === 'ab' ? 'über' : 'unter'} ${fmtNumber(goal.value)}.`
      : `Ziel ${'★'.repeat(goal.level)} ${cmp.value} ${fmtNumber(goal.value)}: dein Bestwert ${fmtNumber(b)}, noch ${sign.value}${fmtNumber(gap)}.`
  }
  if (b === null) return m.next ? `Noch kein Ergebnis: ${'★'.repeat(m.next.level)} ${cmp.value} ${fmtNumber(m.next.value)}.` : ''
  if (!m.next) return `Höchste Stufe ${'★'.repeat(m.level)} erreicht (Bestwert ${fmtNumber(b)}).`
  return `Nächste Stufe ${'★'.repeat(m.next.level)} ${cmp.value} ${fmtNumber(m.next.value)}: dein Bestwert ${fmtNumber(b)}, noch ${sign.value}${fmtNumber(m.next.gap)}.`
})
</script>

<style scoped>
.ts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ts-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ts-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.ts-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--surface);
}

.ts-opt {
  padding: 6px 12px;
  min-height: 36px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--muted);
  font-size: 0.9rem;
  cursor: pointer;
}

.ts-opt.on {
  background: var(--primary);
  color: var(--primary-ink);
}

.ts-missing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.ts-scale {
  padding: 22px 14px 30px;
}

.ts-track {
  position: relative;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--border);
}

.ts-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--radius-pill);
  background: color-mix(in oklab, var(--primary) 70%, transparent);
}

.ts-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ts-star {
  position: absolute;
  bottom: 14px;
  font-size: 0.8rem;
  white-space: nowrap;
  color: var(--muted);
}

.ts-tick {
  width: 3px;
  height: 18px;
  margin-top: -4px;
  border-radius: 2px;
  background: var(--text);
  opacity: 0.55;
}

.ts-marker.goal .ts-tick {
  background: var(--primary);
  opacity: 1;
  width: 4px;
}

.ts-marker.goal .ts-star {
  color: var(--primary);
  font-weight: 700;
}

.ts-val {
  margin-top: 2px;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.ts-best {
  position: absolute;
  top: 12px;
  transform: translateX(-50%);
  color: var(--primary);
  font-size: 0.9rem;
  line-height: 1;
}

.ts-last {
  position: absolute;
  top: 1px;
  width: 8px;
  height: 8px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: var(--text);
  opacity: 0.7;
}

.ts-status {
  margin: 0;
  font-weight: 600;
}

.ts-thresholds {
  margin: 0;
  font-size: 0.9rem;
}

.ts-all summary {
  cursor: pointer;
  font-weight: 600;
}
</style>
