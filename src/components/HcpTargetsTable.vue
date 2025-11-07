<template>
  <div class="card" style="margin-top:10px;">
    <table class="hcp-table" aria-label="HCP Zielwerte">
      <caption class="sr-only">Zielwerte nach Handicap-Bereich</caption>
      <thead>
        <tr>
          <th scope="col" class="text-left p-2">HCP</th>
          <th v-for="(label, idx) in columnLabels" :key="idx" scope="col" class="text-right p-2">{{ label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" :class="row.highlighted ? 'bg-emerald-50' : ''">
          <th scope="row" class="text-left p-2">{{ row.label }}</th>
          <td v-for="(label, idx) in columnLabels" :key="`${row.key}-${idx}`" class="text-right p-2">
            <span :class="cellClass(row, idx)">{{ row.values[idx] ?? '-' }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { buildRowsForDrill } from '@/hcp/buckets';
import { useSettingsStore } from '@/stores/settings';
import type { Drill } from '@/types';
import { computed, onMounted } from 'vue';

const props = defineProps<{ drill: Drill }>()

const settings = useSettingsStore()

onMounted(async () => {
  if (!settings.loaded) await settings.load()
})

const rows = computed(() => buildRowsForDrill(props.drill, settings.hcp))
const columnCount = computed(() => {
  const lengths = rows.value.map(r => r.values.length)
  const max = lengths.length ? Math.max(...lengths) : 0
  return Math.max(1, max)
})
const columnLabels = computed(() => Array.from({ length: columnCount.value }, (_, i) => `L${i + 1}`))

function cellClass(row: any, _i: number) {
  return row.highlighted
    ? 'inline-block px-2 py-1 rounded-md font-semibold text-emerald-900 bg-emerald-100'
    : 'inline-block px-2 py-1 rounded-md text-gray-700'
}
</script>
