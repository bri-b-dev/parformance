<template>
  <div class="container">
    <h1 class="title">Score Differential Calculator</h1>
    <!-- introduction -->
    <p class="intro">
      With this tool you can determine your Score Differential for 9 or 18 holes.
      Enter your current handicap (HCPI), adjusted gross score (AGS), course rating (CR), slope and Playing Conditions Calculation (PCC) to get your individual result.
    </p>
    <form @submit.prevent class="calculator-form">
      <div class="field">
        <label>Holes played:
          <select v-model="holes" required>
            <option value="" disabled>Choose...</option>
            <option value="18">18 holes</option>
            <option value="9">9 holes</option>
          </select>
        </label>
      </div>
      <div class="field">
        <label>Handicap-Index (HCPI):
          <input
            type="number"
            v-model.number="handicapIndex"
            step="0.1"
            :required="holes === '9'"
            placeholder="e.g. 12.3"
          />
        </label>
      </div>
      <div class="field">
        <label>Course Rating (CR):
          <input
            type="number"
            v-model.number="courseRating"
            step="0.1"
            required
            placeholder="e.g. 72.0"
          />
        </label>
      </div>
      <div class="field">
        <label>Slope:
          <input
            type="number"
            v-model.number="slope"
            required
            placeholder="e.g. 113"
          />
        </label>
      </div>
      <div class="field">
        <label>Adjusted Gross Score (AGS):
          <input
            type="number"
            v-model.number="grossScore"
            required
            placeholder="e.g. 85"
          />
        </label>
      </div>
      <div class="field">
        <label>Playing Conditions Calculation (PCC):
          <input
            type="number"
            v-model.number="pccAdjustment"
            required
            step="0.1"
            min="-1.0"
            max="3.0"
            default="0.0"
          />
        </label>
        <small class="validation-note">
          Note: The PCC adjustment ranges from -1.0 to +3.0 (see Rule 5.6).
        </small>
      </div>
    </form>

    <hr class="divider" />

    <!-- result with conditional formatting -->
    <div v-if="scoreDifferential !== null" class="result">
      <p :class="['score', scoreColorClass]">
        <strong>Score Differential:</strong> {{ scoreDifferential.toFixed(1) }}
      </p>
    </div>

    <!-- foot-note with handicap-table -->
    <div class="note">
      <p>
        Note: This calculator serves as a guide and does not replace the official handicap calculation of the association.
        <br />
        <a href="https://www.usga.org/content/dam/usga/pdf/2024-revision/2024-Rules-of-Handicapping-USGA.pdf" target="_blank" class="rules-link">
          Current Handicap-Rules (2024)
        </a>
      </p>
      <p>Scored score differentials are used to calculate the handicap index as follows:</p>
      <table>
        <thead>
          <tr><th>Number of results</th><th>Considered Score Differentials</th><th>Adjustment</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>lowest 1</td><td>-2.0</td></tr>
          <tr><td>2</td><td>lowest 1</td><td>-2.0</td></tr>
          <tr><td>3</td><td>lowest 1</td><td>-2.0</td></tr>
          <tr><td>4</td><td>lowest 1</td><td>-1.0</td></tr>
          <tr><td>5</td><td>lowest 1</td><td>0</td></tr>
          <tr><td>6</td><td>Average of lowest 2</td><td>-1.0</td></tr>
          <tr><td>7-8</td><td>Average of lowest 2</td><td>0</td></tr>
          <tr><td>9-11</td><td>Average of lowest 3</td><td>0</td></tr>
          <tr><td>12-14</td><td>Average of lowest 4</td><td>0</td></tr>
          <tr><td>15-16</td><td>Average of lowest 5</td><td>0</td></tr>
          <tr><td>17-18</td><td>Average of lowest 6</td><td>0</td></tr>
          <tr><td>19</td><td>Average of lowest 7</td><td>0</td></tr>
          <tr><td>20</td><td>Average of lowest 8</td><td>0</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  setup() {
    const holes = ref('')
    const handicapIndex = ref(null)
    const courseRating = ref(null)
    const slope = ref(null)
    const grossScore = ref(null)
    const pccAdjustment = ref(null)

    const scoreDifferential = computed(() => {
      if (
        grossScore.value > 0 &&
        courseRating.value !== null &&
        slope.value !== null &&
        holes.value
      ) {
        if (holes.value === '9') {
          const playedRaw = (grossScore.value - courseRating.value) * (113 / slope.value)
          const played9 = parseFloat(playedRaw.toFixed(1))
          const notPlayedRaw = handicapIndex.value * 0.52 + 1.2
          const notPlayed9 = parseFloat(notPlayedRaw.toFixed(1))
          const adjusted = played9 + notPlayed9 - 0.5 * pccAdjustment.value
          return parseFloat(adjusted.toFixed(1))
        }
        const raw18 = (grossScore.value - courseRating.value) * (113 / slope.value)
        const adjusted18 = raw18 - 1 * pccAdjustment.value
        return parseFloat(adjusted18.toFixed(1))
      }
      return null
    })

    const scoreColorClass = computed(() => {
      if (handicapIndex.value === null || scoreDifferential.value === null) {
        return 'score-neutral'
      }
      if (scoreDifferential.value < handicapIndex.value) return 'score-good'
      if (scoreDifferential.value > handicapIndex.value) return 'score-bad'
      return 'score-neutral'
    })

    return {
      holes,
      handicapIndex,
      courseRating,
      slope,
      grossScore,
      pccAdjustment,
      scoreDifferential,
      scoreColorClass
    }
  }
}
</script>

<style>
/* Basis */
* {
  box-sizing: border-box;
}
body, html {
  min-height: 100vh;
  margin: 0;
  background: #f9f9fb;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  padding-top: 3rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  }

/* Überschrift */
.title {
  font-size: 1.8rem;
  color: #005f73;
  margin: 0;
}

/* Einführung */
.intro {
  margin-top: 0.75rem;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  color: #555;
  text-align: center;
}

/* Formularfelder */
.calculator-form {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.field {
  margin-bottom: 1rem;
}
label {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}
input, select {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.2s;
}
input:focus, select:focus {
  outline: none;
  border-color: #005f73;
}
.validation-note {
  display: block;
  font-size: 0.75rem;
  color: #a00;
}

/* Trennlinie */
.divider {
  width: 100%;
  max-width: 800px;
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 2rem 0;
}

/* Ergebnis */
.result {
  text-align: center;
}
.score {
  font-size: 1.2rem;
  font-weight: bold;
}
.score-good {
  color: #2a9d8f;
}
.score-bad {
  color: #e76f51;
}
.score-neutral {
  color: #333;
}

/* Hinweis und Tabelle */
.note {
  margin-top: 2rem;
  width: 100%;
  max-width: 800px;
  font-size: 0.85rem;
  color: #666;
}
.note p {
  margin: 0.5rem 0;
}
.rules-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #005f73;
  text-decoration: none;
  font-weight: 500;
}
.rules-link:hover {
  text-decoration: underline;
}
.note table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
}
.note th {
  background: #005f73;
  color: #fff;
  padding: 6px;
  font-size: 0.8rem;
}
.note td {
  border: 1px solid #ddd;
  padding: 6px;
  text-align: center;
  font-size: 0.75rem;
}
.note tbody tr:nth-child(odd) {
  background: #f1f1f1;
}
</style>
