<template>
  <div class="card" style="margin-top:10px;">
    <table class="hcp-table" aria-label="HCP Zielwerte">
      <caption class="sr-only">Zielwerte nach Handicap-Bereich (L1–L3)</caption>
      <thead>
        <tr>
          <th scope="col" class="text-left p-2">HCP</th>
          <th scope="col" class="text-right p-2">L1</th>
          <th scope="col" class="text-right p-2">L2</th>
          <th scope="col" class="text-right p-2">L3</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" :class="row.highlighted ? 'bg-emerald-50' : ''">
          <th scope="row" class="text-left p-2">{{ row.label }}</th>
          <td class="text-right p-2"><span :class="cellClass(row, 0)">{{ row.values[0] ?? '–' }}</span></td>
          <td class="text-right p-2"><span :class="cellClass(row, 1)">{{ row.values[1] ?? '–' }}</span></td>
          <td class="text-right p-2"><span :class="cellClass(row, 2)">{{ row.values[2] ?? '–' }}</span></td>
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

function cellClass(row: any, _i: number) {
  return row.highlighted
    ? 'inline-block px-2 py-1 rounded-md font-semibold text-emerald-900 bg-emerald-100'
    : 'inline-block px-2 py-1 rounded-md text-gray-700'
}
</script>
