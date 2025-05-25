<template>
  <div class="container">
    <h1>Score-Differential-Rechner</h1>
    <form @submit.prevent>
      <div>
        <label>Lochanzahl:
          <select v-model="holes" required>
            <option value="" disabled selected>Wähle...</option>
            <option value="18">18 Loch</option>
            <option value="9">9 Loch</option>
          </select>
        </label>
      </div>
      <div>
        <label>Handicap-Index:
          <input
            type="number"
            v-model.number="handicapIndex"
            step="0.1"
            :required="holes === '9'"
          />
        </label>
      </div>
      <div>
        <label>Course Rating:
          <input
            type="number"
            v-model.number="courseRating"
            step="0.1"
            required
          />
        </label>
      </div>
      <div>
        <label>Slope:
          <input
            type="number"
            v-model.number="slope"
            required
          />
        </label>
      </div>
      <div>
        <label>Gewichtetes Brutto­ergebnis (GBE):
          <input
            type="number"
            v-model.number="grossScore"
            required
          />
        </label>
      </div>
    </form>

    <hr/>

    <div v-if="scoreDifferential !== null">
      <p><strong>Score-Differential:</strong> {{ scoreDifferential.toFixed(1) }}</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  setup() {
    const holes = ref('')               // Anfang leer
    const handicapIndex = ref(null)
    const courseRating = ref(null)
    const slope = ref(null)
    const grossScore = ref(null)

    const scoreDifferential = computed(() => {
      // erst berechnen, wenn GBE > 0 und alle Felder gesetzt
      if (
        grossScore.value > 0 &&
        courseRating.value !== null &&
        slope.value !== null &&
        holes.value
      ) {
        if (holes.value === '9') {
          // Gespielte 9 Loch
          const playedRaw = (grossScore.value - courseRating.value) * (113 / slope.value)
          const played9 = parseFloat(playedRaw.toFixed(1))
          // Nicht gespielte 9 Loch
          const notPlayedRaw = handicapIndex.value * 0.52 + 1.2
          const notPlayed9 = parseFloat(notPlayedRaw.toFixed(1))
          return played9 + notPlayed9
        }
        // 18 Loch Score-Differential
        const diff = (grossScore.value - courseRating.value) * (113 / slope.value)
        return parseFloat(diff.toFixed(1))
      }
      return null
    })

    return {
      holes,
      handicapIndex,
      courseRating,
      slope,
      grossScore,
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
  width: 120px;
}
hr {
  margin: 1rem 0;
}
</style>