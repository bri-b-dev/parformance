<template>
  <div class="card" style="margin-top:10px;">
    <p v-if="currentHcp == null" class="muted hcp-missing" data-testid="hcp-missing">
      Trage dein Handicap ein, dann wird deine Zeile hervorgehoben.
      <button type="button" class="btn" @click="ui.setSettings(true)">Handicap eintragen</button>
    </p>
    <table class="hcp-table" aria-label="HCP Zielwerte">
      <caption class="sr-only">Zielwerte nach Handicap-Bereich</caption>
      <thead>
        <tr>
          <th scope="col" class="text-left p-2">HCP</th>
          <th v-for="(label, idx) in columnLabels" :key="idx" scope="col" class="text-right p-2">{{ label }}</th>
          <th v-if="hasRadius" scope="col" class="text-right p-2">Radius</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" :class="row.highlighted ? 'bg-emerald-50' : ''">
          <th scope="row" class="text-left p-2">
            {{ row.label }}
            <span v-if="row.highlighted" class="chip">Du</span>
            <span v-if="row.isTarget" class="chip">Ziel</span>
          </th>
          <td v-for="(_, idx) in columnLabels" :key="`${row.key}-${idx}`" class="text-right p-2">
            <span :class="cellClass(row, idx)">{{ row.values[idx] ?? '-' }}</span>
          </td>
          <td v-if="hasRadius" class="text-right p-2">
            <span :class="cellClass(row, 0)">{{ radiusLabel(row.key) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { buildRowsForDrill } from '@/hcp/buckets';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import type { Drill } from '@/types';
import { computed, onMounted } from 'vue';

const props = defineProps<{ drill: Drill }>()

const settings = useSettingsStore()
const ui = useUiStore()
const { hcp: currentHcp } = useCurrentHcp()

onMounted(async () => {
  if (!settings.loaded) await settings.load()
})

const rows = computed(() => buildRowsForDrill(props.drill, currentHcp.value, settings.targetHcp))
const columnCount = computed(() => {
  const lengths = rows.value.map(r => r.values.length)
  const max = lengths.length ? Math.max(...lengths) : 0
  return Math.max(1, max)
})
const columnLabels = computed(() => Array.from({ length: columnCount.value }, (_, i) => `L${i + 1}`))

const hasRadius = computed(() => !!props.drill.metric.hcpRadius)
function radiusLabel(key: string) {
  const r = props.drill.metric.hcpRadius?.[key]
  return typeof r === 'number' ? `≤ ${String(r).replace('.', ',')} m` : '-'
}

function cellClass(row: any, _i: number) {
  // Use theme-aware CSS classes (variables) so contrast adapts for light/dark themes.
  return row.highlighted ? 'hcp-cell hcp-cell--highlight' : 'hcp-cell'
}
</script>

<style scoped>
.hcp-missing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 0.9rem;
}
</style>
