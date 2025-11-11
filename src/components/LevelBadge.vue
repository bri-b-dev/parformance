<template>
  <span class="chip" :title="tooltip" :aria-label="ariaLabel" data-testid="level-badge">
    <template v-if="level != null">
      Level {{ level }}
    </template>
    <template v-else>
      Level -
    </template>
  </span>
</template>

<script setup lang="ts">
import { findBucketKey, formatRangeLabel } from '@/hcp/buckets'
import { computeLevelForDrill } from '@/hcp/level'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { Drill } from '@/types'
import { computed, onMounted } from 'vue'

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
const level = computed<1 | 2 | 3 | null>(() => {
  const s = latest.value
  if (!s) return null
  let lvl = typeof s.levelReached === 'number' ? s.levelReached : computeLevelForDrill(props.drill, settings.hcp, Number(s.result?.value))
  if (!Number.isFinite(lvl)) return null
  // Only render 1..3; 0 maps to neutral
  if (lvl >= 1 && lvl <= 3) return lvl as 1 | 2 | 3
  return null
})

const tooltip = computed(() => {
  const targets = props.drill.metric?.hcpTargets || {}
  const key = typeof settings.hcp === 'number' ? findBucketKey(settings.hcp, targets) : null
  if (!key) {
    return 'Keine HCP-Zielwerte vorhanden'
  }
  const targetEntry = targets[key]
  const arr = Array.isArray(targetEntry) ? targetEntry : [targetEntry]
  const label = formatRangeLabel(key)
  const parts = arr
    .map((val, idx) => {
      const numeric = Number(val)
      return Number.isFinite(numeric) ? `L${idx + 1} ${numeric}` : null
    })
    .filter(Boolean) as string[]
  return parts.length ? `HCP ${label}: ${parts.join(', ')}` : `HCP ${label}: -`
})

const ariaLabel = computed(() => level.value ? `Level erreicht: ${level.value}` : 'Kein Level ermittelt')
</script>
