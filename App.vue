<template>
  <div class="container">
    <div class="lang-switcher">
      <select v-model="$i18n.locale" aria-label="Sprache wechseln">
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </select>
    </div>

    <div class="card">
      <h1 class="title">{{ $t('title') }}</h1>
      <p class="intro">{{ $t('intro') }}</p>

      <!-- Aktueller Handicap-Index aus gespeicherten Ergebnissen -->
      <div class="current-index" v-if="results.length">
        <strong>{{ $t('currentHandicap') }}:</strong>
        {{ handicapIndexComputed.toFixed(1) }}
      </div>

      <form class="calculator-form" @submit.prevent="onCalculate">
        <div class="form-group">
          <label>{{ $t('holesPlayed') }}</label>
          <select v-model="holes" required>
            <option value="" disabled>{{ $t('choose') }}</option>
            <option value="18">18 {{ $t('holes') }}</option>
            <option value="9">9 {{ $t('holes') }}</option>
          </select>
        </div>

        <!-- Handicap-Index Eingabe mit Default-Wert -->
        <div class="form-group">
          <label>{{ $t('handicapIndex') }}</label>
          <input type="number" v-model.number="handicapIndex" step="0.1"
            :placeholder="`${$t('forExample')} ${handicapIndexComputed.toFixed(1)}`" />
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
        <button class="btn-secondary" @click="openDatePicker">{{ $t('saveResult') }}</button>
      </div>

    <!-- Datepicker Modal -->
    <div v-if="showDatePicker" class="modal-backdrop">
      <div class="modal">
        <h3>{{ $t('chooseDate') }}</h3>
        <input type="date" v-model="pickedDate" />
        <div class="modal-actions">
            <button class="btn-secondary" @click="confirmSave">{{ $t('confirm') }}</button>
            <button class="btn-secondary" @click="closeDatePicker">{{ $t('cancel') }}</button>
          </div>
        </div>
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
    <!-- Gespeicherte Ergebnisse und Handicap-Index -->
    <div class="card results-card" v-if="results.length">
      <h2>{{ $t('yourResults') }}</h2>
      <table>
        <thead>
          <tr>
            <th>{{ $t('date') }}</th>
            <th>{{ $t('course') }}</th>
            <th>{{ $t('grossScore') }}</th>
            <th>{{ $t('scoreDifferential') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in sortedResults" :key="res.id">
            <td>{{ new Date(res.date).toLocaleDateString() }}</td>
            <td>{{ res.courseName }}</td>
            <td>{{ res.grossScore }}</td>
            <td>{{ res.scoreDifferential.toFixed(1) }}</td>
            <td><button @click="deleteResult(res.id)">{{ $t('delete') }}</button></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/db'

// State
const holes = ref('')
const handicapIndex = ref(0)
const courseRating = ref(null)
const slope = ref(null)
const grossScore = ref(null)
const pccAdjustment = ref(0)
const calculated = ref(false)
const results = ref([])
const showDatePicker = ref(false)
const pickedDate = ref(new Date().toISOString().substr(0, 10))

// Score Differential Berechnung
const scoreDifferential = computed(() => {
  if (!calculated.value) return 0
  if (holes.value === '9') {
    const played9 = (grossScore.value - courseRating.value) * (113 / slope.value)
    const notPlayed9 = handicapIndexComputed.value * 0.52 + 1.2
    return parseFloat((played9 + notPlayed9 - 0.5 * pccAdjustment.value).toFixed(1))
  }
  const raw18 = (grossScore.value - courseRating.value) * (113 / slope.value)
  return parseFloat((raw18 - pccAdjustment.value).toFixed(1))
})

// Handicap-Index Berechnung gemäß Tabelle
const handicapIndexComputed = computed(() => {
  const diffs = results.value.map(r => r.scoreDifferential).sort((a, b) => a - b)
  const n = diffs.length
  if (!n) return 0
  let count, adjustment
  if (n <= 3) { count = 1; adjustment = -2.0 }
  else if (n === 4) { count = 1; adjustment = -1.0 }
  else if (n === 5) { count = 1; adhandicapIndexComputedjustment = 0.0 }
  else if (n === 6) { count = 2; adjustment = -1.0 }
  else if (n <= 8) { count = 2; adjustment = 0.0 }
  else if (n <= 11) { count = 3; adjustment = 0.0 }
  else if (n <= 14) { count = 4; adjustment = 0.0 }
  else if (n <= 16) { count = 5; adjustment = 0.0 }
  else if (n <= 18) { count = 6; adjustment = 0.0 }
  else if (n === 19) { count = 7; adjustment = 0.0 }
  else { count = 8; adjustment = 0.0 }
  const avg = diffs.slice(0, count).reduce((sum, v) => sum + v, 0) / count
  return parseFloat((avg + adjustment).toFixed(1))
})

// Farbklassen
const scoreColorClass = computed(() => {
  if (!calculated.value) return 'score-neutral'
  if (scoreDifferential.value < handicapIndexComputed.value) return 'score-good'
  if (scoreDifferential.value > handicapIndexComputed.value) return 'score-bad'
  return 'score-neutral'
})

// Sortierte Ergebnisse (neueste zuerst)
const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Lifecycle
onMounted(async () => {
  results.value = await db.results.orderBy('date').reverse().toArray()
  handicapIndex.value = handicapIndexComputed.value
})

// Funktionen
function onCalculate() {
  calculated.value = true
}

function openDatePicker() {
  pickedDate.value = new Date().toISOString().substr(0, 10)
  showDatePicker.value = true
}

function closeDatePicker() {
  showDatePicker.value = false
}

async function confirmSave() {
  const entry = {
    date: pickedDate.value,
    courseName: `${courseRating.value}/${slope.value}`,
    grossScore: grossScore.value,
    scoreDifferential: scoreDifferential.value
  }
  const id = await db.results.add(entry)
  results.value.unshift({ id, ...entry })
  showDatePicker.value = false
  calculated.value = false
  handicapIndex.value = handicapIndexComputed.value
}

async function deleteResult(id) {
  await db.results.delete(id)
  results.value = results.value.filter(r => r.id !== id)
  handicapIndex.value = handicapIndexComputed.value
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

/* Neue Buttons */
.btn-secondary {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid var(--primary);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-secondary:hover {
  background: var(--primary);
  color: #fff;
}

/* Ergebnisse-Card */
.results-card {
  margin-top: 2rem;
}

.results-card table {
  width: 100%;
  border-collapse: collapse;
}

.results-card th,
.results-card td {
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
}

.results-card tbody tr:nth-child(odd) {
  background: #f9f9fb;

  /* einfaches Modal-Styling */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    width: 90%;
    max-width: 320px;
    text-align: center;
  }

  .modal-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .modal-actions button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
}
</style>
