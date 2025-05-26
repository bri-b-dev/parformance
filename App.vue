<template>
  <div class="container">
    <!-- <div class="lang-switcher">
      <select v-model="$i18n.locale">
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </div> -->

    <div class="card">
      <h1 class="title">{{ $t('title') }}</h1>
      <p class="intro">{{ $t('intro') }}</p>
      <form class="calculator-form" @submit.prevent="onCalculate">
        <div class="form-group">
          <label>{{ $t('holesPlayed') }}</label>
          <select v-model="holes" required>
            <option value="" disabled>{{ $t('choose') }}</option>
            <option value="18">18 {{ $t('holes') }}</option>
            <option value="9">9 {{ $t('holes') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('handicapIndex') }}</label>
          <input type="number" v-model.number="handicapIndex" :required="holes === '9'" step="0.1"
            :placeholder="`${$t('forExample')} 12.3`" />
        </div>
        <div class="form-group">
          <label>{{ $t('courseRating') }}</label>
          <input type="number" v-model.number="courseRating" step="0.1" required
            :placeholder="`${$t('forExample')} 72.0`" />
        </div>
        <div class="form-group">
          <label>{{ $t('slope') }}</label>
          <input type="number" v-model.number="slope" required :placeholder="`${$t('forExample')} 113`" />
        </div>

        <div class="form-group">
          <label>{{ $t('grossScore') }}</label>
          <input type="number" v-model.number="grossScore" required :placeholder="`${$t('forExample')} 85`" />
        </div>
        <div class="form-group full-width">
          <label>{{ $t('pcc') }}</label>
          <input type="number" v-model.number="pccAdjustment" required step="0.1" min="-1.0" max="3.0"
            :placeholder="`${$t('forExample')} 0.0`" />
          <small class="validation-note">{{ $t('pccNote') }}</small>
        </div>
        <button type="submit" class="btn">{{ $t('calculate') }}</button>
      </form>

      <div v-if="calculated" class="result">
        <p :class="['score', scoreColorClass]">
          <strong>{{ $t('scoreDifferential') }}:</strong>
          {{ scoreDifferential.toFixed(1) }}
        </p>
      </div>
    </div>

    <div class="note">
      <p>
        {{ $t('note1') }}<br>
        <a href="https://www.usga.org/content/dam/usga/pdf/2024-revision/2024-Rules-of-Handicapping-USGA.pdf"
          target="_blank" rel="noopener" class="rules-link">
          {{ $t('currentRules') }}
        </a>
      </p>
      <p>{{ $t('note2') }}</p>
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
            <td>>= 20</td>
            <td>{{ $t('lowestAverage') }} 8</td>
            <td>0</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const holes = ref('')
const handicapIndex = ref(null)
const courseRating = ref(null)
const slope = ref(null)
const grossScore = ref(null)
const pccAdjustment = ref(null)
const calculated = ref(false)

const scoreDifferential = computed(() => {
  if (!calculated.value) return 0
  if (holes.value === '9') {
    const played9 = parseFloat(((grossScore.value - courseRating.value) * (113 / slope.value)).toFixed(1))
    const notPlayed9 = parseFloat((handicapIndex.value * 0.52 + 1.2).toFixed(1))
    return parseFloat((played9 + notPlayed9 - 0.5 * pccAdjustment.value).toFixed(1))
  }
  return parseFloat((((grossScore.value - courseRating.value) * (113 / slope.value) - pccAdjustment.value)).toFixed(1))
})

const scoreColorClass = computed(() => {
  if (!calculated.value) return 'score-neutral'
  if (scoreDifferential.value < handicapIndex.value) return 'score-good'
  if (scoreDifferential.value > handicapIndex.value) return 'score-bad'
  return 'score-neutral'
})

function onCalculate() {
  calculated.value = true
}
</script>

<style>
:root {
  --primary: #005f73;
  --accent: #2a9d8f;
  --danger: #e76f51;
  --bg-card: #fff;
  --bg-page: #f9f9fb;
  --text: #333;
  --text-muted: #555;
}

* {
  box-sizing: border-box
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg-page);
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: var(--text);
}

.container {
  max-width: 900px;
  margin: auto;
  padding: 2rem;
  position: relative;
}

.lang-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.lang-switcher select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.card {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.title {
  margin: 0;
  font-size: 2rem;
  color: var(--primary);
}

.intro {
  margin: 0.5rem 0 2rem;
  color: var(--text-muted);
}

.calculator-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
@media (max-width: 600px) {
  .calculator-form {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
}

.validation-note {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--danger);
}

.btn {
  grid-column: 1 / -1;
  padding: 0.75rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover {
  background: var(--accent);
}

.result {
  margin-top: 1.5rem;
  text-align: center;
}

.score {
  font-size: 1.5rem;
}

.score-good {
  color: var(--accent);
}

.score-bad {
  color: var(--danger);
}

.score-neutral {
  color: var(--text);
}

.note {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #666;
}

.note a.rules-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.note a.rules-link:hover {
  text-decoration: underline;
}

.note table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.note th {
  background: var(--primary);
  color: #fff;
  padding: 8px;
  font-size: 0.8rem;
}

.note td {
  border: 1px solid #ddd;
  text-align: center;
  padding: 6px;
  font-size: 0.75rem;
}

.note tbody tr:nth-child(odd) {
  background: #f1f1f1;
}
</style>
