<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { useI18n } from 'vue-i18n'
import { de, enUS } from 'date-fns/locale'

const { locale } = useI18n()

// Props: Daten chronologisch sortiert
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const canvas = ref<any>(null)
let chartInstance: any = null

const buildChart = () => {
  if (!canvas.value || !props.data.length) return

  // Map data to {x: Date, y}
  const parsedData = props.data.map((r: any) => {
    return {
      x: new Date(r.date),
      yDiff: r.scoreDifferential,
      yHC: r.storedHandicap
    }
  })
  const diffData = parsedData.map(p => ({ x: p.x, y: p.yDiff }))
  const hcData   = parsedData.map(p => ({ x: p.x, y: p.yHC }))

  // Determine date-fns locale
  const dfnsLocale = locale.value === 'de' ? de : enUS

  const config = {
    type: 'line',
    data: { datasets: [
      { label: 'Score Differential', data: diffData, borderColor: 'rgba(42,157,143,1)', fill: false, tension: 0 },
      { label: 'Handicap Index',    data: hcData,   borderColor: 'rgba(230,111,81,1)', fill: false, tension: 0 }
    ]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: { month: 'MM/yy' },
            tooltipFormat: 'P'
          },
          adapters: { date: { locale: dfnsLocale } },
          distribution: 'linear',
          title: { display: false },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: { title: { display: true } }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  }

  if (chartInstance) chartInstance.destroy()
  // @ts-ignore
  chartInstance = new Chart(canvas.value.getContext('2d'), config)
}

onMounted(buildChart)
watch(() => [props.data, locale.value], buildChart)
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 340px;
  margin: 1rem 0;
}
</style>
