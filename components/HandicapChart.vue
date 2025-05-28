<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

// Props: Daten in chronologischer Reihenfolge
const props = defineProps({
  data: {
    type: Array,
    required: true,
    // jedes Element: { date: 'YYYY-MM-DD', scoreDifferential: Number, storedHandicap: Number }
  }
})

const canvas = ref(null)
let chartInstance = null

const buildChart = () => {
  const labels = props.data.map(r => new Date(r.date).toLocaleDateString())
  const diffData = props.data.map(r => r.scoreDifferential)
  const hcData   = props.data.map(r => r.storedHandicap)

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Score Differential',
          data: diffData,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Handicap Index',
          data: hcData,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Datum' } },
        y: { title: { display: true, text: 'Wert' } }
      }
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
