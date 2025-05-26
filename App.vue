<template>
  <div class="container">
    <div class="lang-switcher">
      <select v-model="$i18n.locale">
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
    <h1 class="title">{{ $t('title') }}</h1>

    <!-- introduction -->
    <p class="intro"> {{ $t('intro') }}</p>
    <form @submit.prevent class="calculator-form">
      <div class="field">
        <label>{{ $t('holesPlayed') }}
          <select v-model="holes" required>
            <option value="" disabled>{{ $t('choose') }}</option>
            <option value="18">18 {{ $t('holes') }}</option>
            <option value="9">9 {{ $t('holes') }}</option>
          </select>
        </label>
      </div>
      <div class="field">
        <label>{{ $t('handicapIndex') }}
          <input type="number" v-model.number="handicapIndex" step="0.1" :required="holes === '9'"
            :placeholder="`${$t('forExample')} 12.3`" />
        </label>
      </div>
      <div class="field">
        <label>{{ $t('courseRating') }}
          <input type="number" v-model.number="courseRating" step="0.1" required
            :placeholder="`${$t('forExample')} 72.0`" />
        </label>
      </div>
      <div class="field">
        <label>{{ $t('slope') }}
          <input type="number" v-model.number="slope" required :placeholder="`${$t('forExample')} 113`" />
        </label>
      </div>
      <div class="field">
        <label>{{ $t('grossScore') }}
          <input type="number" v-model.number="grossScore" required :placeholder="`${$t('forExample')} 85`" />
        </label>
      </div>
      <div class="field">
        <label>{{ $t('pcc') }}
          <input type="number" v-model.number="pccAdjustment" required step="0.1" min="-1.0" max="3.0" default="0.0" />
        </label>
        <small class="validation-note">
          {{ $t('pccNote') }}
        </small>
      </div>
    </form>

    <hr class="divider" />

    <!-- result with conditional formatting -->
    <div v-if="scoreDifferential !== null" class="result">
      <p :class="['score', scoreColorClass]">
        <strong>{{ $t('scoreDifferential') }}:</strong> {{ scoreDifferential.toFixed(1) }}
      </p>
    </div>

    <!-- foot-note with handicap-table -->
    <div class="note">
      <p>
        {{ $t('note1') }}
        <br />
        <a href="https://www.usga.org/content/dam/usga/pdf/2024-revision/2024-Rules-of-Handicapping-USGA.pdf"
          target="_blank" class="rules-link">
          {{ $t('currentRules') }}
        </a>
      </p>
      <p>
        {{ $t('note2') }}</p>
      <table>
        <thead>
          <tr>
            <th>{{ $t('noOfResults') }}</th>
            <th>{{ $t('consideredScoreDifferentials') }}</th>
            <th>{{ $t('adjustment') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>{{ $t('lowest') }}</td>
            <td>-2.0</td>
          </tr>
          <tr>
            <td>2</td>
            <td>{{ $t('lowest') }}</td>
            <td>-2.0</td>
          </tr>
          <tr>
            <td>3</td>
            <td>{{ $t('lowest') }}</td>
            <td>-2.0</td>
          </tr>
          <tr>
            <td>4</td>
            <td>{{ $t('lowest') }}</td>
            <td>-1.0</td>
          </tr>
          <tr>
            <td>5</td>
            <td>{{ $t('lowest') }}</td>
            <td>0</td>
          </tr>
          <tr>
            <td>6</td>
            <td>{{ $t('lowestAverage') }} 2</td>
            <td>-1.0</td>
          </tr>
          <tr>
            <td>7-8</td>
            <td>{{ $t('lowestAverage') }} 2</td>
            <td>0</td>
          </tr>
          <tr>
            <td>9-11</td>
            <td>{{ $t('lowestAverage') }} 3</td>
            <td>0</td>
          </tr>
          <tr>
            <td>12-14</td>
            <td>{{ $t('lowestAverage') }} 4</td>
            <td>0</td>
          </tr>
          <tr>
            <td>15-16</td>
            <td>{{ $t('lowestAverage') }} 5</td>
            <td>0</td>
          </tr>
          <tr>
            <td>17-18</td>
            <td>{{ $t('lowestAverage') }} 6</td>
            <td>0</td>
          </tr>
          <tr>
            <td>19</td>
            <td>{{ $t('lowestAverage') }} 7</td>
            <td>0</td>
          </tr>
          <tr>
            <td>20</td>
            <td>{{ $t('lowestAverage') }} 8</td>
            <td>0</td>
          </tr>
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
* {
  box-sizing: border-box;
}

body,
html {
  min-height: 100vh;
  margin: 0;
  background: #f9f9fb;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  text-align: center;
}

.title {
  font-size: 1.8rem;
  color: #005f73;
  margin: 0;
}

.intro {
  margin-top: 0.75rem;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  color: #555;
}

.calculator-form {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.field {
  margin-bottom: 1rem;
}

label {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}

input,
select {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.2s;
}

input:focus,
select:focus {
  outline: none;
  border-color: #005f73;
}

.validation-note {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #a00;
}

.divider {
  width: 100%;
  max-width: 800px;
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 2rem auto;
}

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
  margin: 0 auto;
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
