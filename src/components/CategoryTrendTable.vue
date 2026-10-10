<template>
  <table class="trend" data-testid="trend-table">
    <caption class="sr-only">Fähigkeiten je Kategorie mit Veränderung zum Zeitraum davor</caption>
    <thead>
      <tr>
        <th scope="col">Kategorie</th>
        <th scope="col" class="num">Wert</th>
        <th scope="col">Veränderung</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.category" :data-testid="`trend-${r.category}`">
        <th scope="row">{{ r.category }}</th>
        <td class="num">{{ r.hasData ? `${r.score} %` : '–' }}</td>
        <td>
          <span class="sym" :class="symClass(r)" aria-hidden="true">{{ trend(r).symbol }}</span>
          <span class="txt">{{ trend(r).text }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { trendText, type CategoryRow } from '@/stats/progress'

defineProps<{ rows: CategoryRow[] }>()

const trend = (r: CategoryRow) => trendText(r)
const symClass = (r: CategoryRow) => (r.delta === null ? 'none' : r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : 'flat')
</script>

<style scoped>
.trend {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.trend th,
.trend td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.trend thead th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.85rem;
}

.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sym {
  display: inline-block;
  width: 1.2em;
  margin-right: 4px;
}

.sym.up {
  color: var(--primary);
}

.sym.down {
  color: var(--danger-600, #ef4444);
}

.txt {
  color: var(--muted);
}
</style>
