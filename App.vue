<template>
  <div class="container">
    <h1>Handicap-Rechner</h1>
    <form @submit.prevent>
      <div>
        <label>Lochanzahl:
          <select v-model="holes">
            <option value="18">18 Loch</option>
            <option value="9">9 Loch</option>
          </select>
        </label>
      </div>
      <div>
        <label>Handicap-Index:
          <input type="number" v-model.number="handicapIndex" step="0.1" />
        </label>
      </div>
      <div>
        <label>Course Rating:
          <input type="number" v-model.number="courseRating" step="0.1" />
        </label>
      </div>
      <div>
        <label>Slope:
          <input type="number" v-model.number="slope" />
        </label>
      </div>
      <div>
        <label>Gewichtetes Brutto­ergebnis:
          <input type="number" v-model.number="grossScore" />
        </label>
      </div>
    </form>

    <hr/>

    <div>
      <p><strong>Score-Differential:</strong> {{ scoreDifferential.toFixed(1) }}</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  setup() {
    const handicapIndex   = ref(0)
    const courseRating    = ref(72)    // Standard-Par
    const slope           = ref(113)   // Standard-Slope
    const grossScore      = ref(0)
    const holes           = ref('18')  // '9' oder '18'

    const scoreDifferential = computed(() => {
      if (holes.value === '9') {
        // Gespielte 9 Loch mit Rundung auf eine Nachkommastelle
        const playedRaw = (grossScore.value - courseRating.value) * (113 / slope.value)
        const played9 = parseFloat(playedRaw.toFixed(1))
        // Nicht gespielte 9 Loch mit Rundung auf eine Nachkommastelle
        const notPlayedRaw = handicapIndex.value * 0.52 + 1.2
        const notPlayed9 = parseFloat(notPlayedRaw.toFixed(1))
        return played9 + notPlayed9
      }
      // Standard-Berechnung für 18 Loch
      //return handicapIndex.value * (slope.value / 113)
      return parseFloat(grossScore.value - courseRating.value) * (113 / slope.value)
    })

    return {
      handicapIndex,
      courseRating,
      slope,
      grossScore,
      holes,
      scoreDifferential
    }
  }
}
</script>

<style>
body {
  font-family: sans-serif;
  padding: 1rem;
}
.container {
  max-width: 400px;
  margin: auto;
}
form div {
  margin-bottom: 0.5rem;
}
label {
  display: flex;
  justify-content: space-between;
}
input, select {
  width: 100px;
}
hr {
  margin: 1rem 0;
}
</style>
