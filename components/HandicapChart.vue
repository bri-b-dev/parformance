<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
// Date adapter installieren und importieren (z.B. date-fns)
import 'chartjs-adapter-date-fns'

// Props: Daten chronologisch sortiert
const props = defineProps({
  data: {
    type: Array,
    required: true
    // jedes Element: { date: 'YYYY-MM-DD', scoreDifferential: Number, storedHandicap: Number }
  }
})

const canvas = ref(null)
let chartInstance = null

const buildChart = () => {
  if (!canvas.value || !props.data.length) return

  // X-Werte als Date-Objekte
  const parsedData = props.data.map(r => ({
    x: new Date(r.date),
    yDiff: r.scoreDifferential,
    yHC: r.storedHandicap
  }))

  const diffData = parsedData.map(p => ({ x: p.x, y: p.yDiff }))
  const hcData   = parsedData.map(p => ({ x: p.x, y: p.yHC }))

  const config = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Score Differential',
          data: diffData,
          borderColor: 'rgba(42, 157, 143, 1)',
          backgroundColor: 'rgba(42, 157, 143, 0.2)',
          fill: false,
          tension: 0 // keine geschwungene Kurve
        },
        {
          label: 'Handicap Index',
          data: hcData,
          borderColor: 'rgba(230, 111, 81, 1)',
          backgroundColor: 'rgba(230, 111, 81, 0.2)',
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: { month: 'MMM yyyy' }
          },
          distribution: 'linear',
          title: { display: true, text: 'Datum' },
          ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 }
        },
        y: {
          title: { display: true, text: 'Wert' }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  }

  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(canvas.value.getContext('2d'), config)
}

onMounted(buildChart)
watch(() => props.data, buildChart)
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  margin: 1rem 0;
}
</style>
