<template>
  <div class="container">
    <h1>Score-Differential-Rechner</h1>
    <!-- Einführungstext -->
    <p class="intro">
      Mit diesem Score-Differential-Rechner ermittelst du dein Score Differential für 9 oder 18 Loch. 
      Gib dein gewichtetes Bruttoergebnis (GBE), Course Rating und Slope ein, und erhalte dein individuelles Ergebnis.
    </p>
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
            placeholder="z.B. 12.3"
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
            placeholder="z.B. 72.0"
          />
        </label>
      </div>
      <div>
        <label>Slope:
          <input
            type="number"
            v-model.number="slope"
            required
            placeholder="z.B. 113"
          />
        </label>
      </div>
      <div>
        <label>Gewichtetes Brutto­ergebnis (GBE):
          <input
            type="number"
            v-model.number="grossScore"
            required
            placeholder="z.B. 85"
          />
        </label>
      </div>
    </form>

    <hr/>

    <!-- Ergebnisanzeige -->
    <div v-if="scoreDifferential !== null" class="result">
      <p><strong>Score-Differential:</strong> {{ scoreDifferential.toFixed(1) }}</p>
    </div>

    <!-- Fußnote mit Handicap-Tabelle -->
    <div class="note">
      <p>
        Hinweis: Dieser Rechner dient als Orientierung und ersetzt nicht die offizielle Handicap-Berechnung des Verbandes.
      </p>
      <p>Zur Berechnung des Handicap-Index werden gewertete Score Differentials wie folgt herangezogen:</p>
      <table>
        <tr><th>Anzahl Ergebnisse</th><th>Im Stammblatt gewertete Score Differentials</th><th>Anpassung</th></tr>
        <tr><td>1</td><td>der niedrigste</td><td>-2,0</td></tr>
        <tr><td>2</td><td>der niedrigste</td><td>-2,0</td></tr>
        <tr><td>3</td><td>der niedrigste</td><td>-2,0</td></tr>
        <tr><td>4</td><td>der niedrigste</td><td>-1,0</td></tr>
        <tr><td>5</td><td>der niedrigste</td><td>0</td></tr>
        <tr><td>6</td><td>Durchschnitt der niedrigsten 2</td><td>-1,0</td></tr>
        <tr><td>7-8</td><td>Durchschnitt der niedrigsten 2</td><td>0</td></tr>
        <tr><td>9-11</td><td>Durchschnitt der niedrigsten 3</td><td>0</td></tr>
        <tr><td>12-14</td><td>Durchschnitt der niedrigsten 4</td><td>0</td></tr>
        <tr><td>15-16</td><td>Durchschnitt der niedrigsten 5</td><td>0</td></tr>
        <tr><td>17-18</td><td>Durchschnitt der niedrigsten 6</td><td>0</td></tr>
        <tr><td>19</td><td>Durchschnitt der niedrigsten 7</td><td>0</td></tr>
        <tr><td>>= 20</td><td>Durchschnitt der niedrigsten 8</td><td>0</td></tr>
      </table>
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
body, html {
  height: 100%;
  margin: 0;
}
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 1rem;
  font-family: sans-serif;
  box-sizing: border-box;
}
.intro {
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
}
form {
  width: 100%;
  max-width: 400px;
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
  width: 100%;
  max-width: 400px;
}
.result p {
  font-size: 1.1rem;
  color: #007700;
  text-align: center;
}
.note {
  margin-top: 1rem;
  width: 100%;
  max-width: 400px;
  font-size: 0.8rem;
  color: #666;
}
.note table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.note th,
.note td {
  border: 1px solid #ccc;
  padding: 4px;
  text-align: center;
  font-size: 0.75rem;
}
</style>
