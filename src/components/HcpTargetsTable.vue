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
  // Use theme-aware CSS classes (variables) so contrast adapts for light/dark themes.
  return row.highlighted ? 'hcp-cell hcp-cell--highlight' : 'hcp-cell'
}
</script>

<style scoped>
.hcp-cell {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: var(--text);
  background: transparent;
  font-weight: 500;
}

/* Highlighted cell: stronger contrast using accent color mixed with surface.
   This uses CSS variables so the result adapts between light and dark themes. */
.hcp-cell--highlight {
  /* mix a bit of the accent-green into the surface for background */
  background: color-mix(in oklab, var(--accent-green) 14%, var(--surface));
  /* text should be readable: mix accent-green heavily with text color */
  color: color-mix(in oklab, var(--accent-green) 82%, var(--text));
  box-shadow: 0 1px 0 color-mix(in oklab, rgba(0,0,0,0.06) 10%, transparent) inset;
  font-weight: 700;
}

/* Non-highlighted smaller contrast but still readable */
.hcp-cell:not(.hcp-cell--highlight) {
  color: var(--muted);
}
</style>
