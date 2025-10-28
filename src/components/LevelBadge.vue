<template>
  <span
    class="chip"
    :title="tooltip"
    :aria-label="ariaLabel"
    data-testid="level-badge"
  >
    <template v-if="level != null">
      Level {{ level }}
    </template>
    <template v-else>
      Level —
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Drill } from '@/types'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { computeLevelForDrill } from '@/hcp/level'
import { findBucketKey, formatRangeLabel } from '@/hcp/buckets'

const props = defineProps<{ drill: Drill }>()

const sessions = useSessionsStore()
const settings = useSettingsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
  if (!settings.loaded) await settings.load()
})

// Latest session for this drill
const latest = computed(() => sessions.latestByDrill(props.drill.id))

// Display level: prefer stored levelReached; otherwise compute from current hcp + result
const level = computed<1|2|3|null>(() => {
  const s = latest.value
  if (!s) return null
  let lvl = typeof s.levelReached === 'number' ? s.levelReached : computeLevelForDrill(props.drill, settings.hcp, Number(s.result?.value))
  if (!Number.isFinite(lvl)) return null
  // Only render 1..3; 0 maps to neutral
  if (lvl >= 1 && lvl <= 3) return lvl as 1|2|3
  return null
})

const tooltip = computed(() => {
  const targets = props.drill.metric?.hcpTargets || {}
  const key = typeof settings.hcp === 'number' ? findBucketKey(settings.hcp, targets) : null
  if (!key) {
    return 'Keine HCP-Zielwerte vorhanden'
  }
  const arr = targets[key] || []
  const [L1, L2, L3] = [arr[0], arr[1], arr[2]]
  const label = formatRangeLabel(key)
  const parts: string[] = []
  if (Number.isFinite(L1)) parts.push(`L1 ${L1}`)
  if (Number.isFinite(L2)) parts.push(`L2 ${L2}`)
  if (Number.isFinite(L3)) parts.push(`L3 ${L3}`)
  return parts.length ? `HCP ${label}: ${parts.join(', ')}` : `HCP ${label}: —`
})

const ariaLabel = computed(() => level.value ? `Level erreicht: ${level.value}` : 'Kein Level ermittelt')
</script>
