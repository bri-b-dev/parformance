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

      <div class="note">
        <p>
          {{ $t('note1') }}<br>
          <a href="https://www.usga.org/content/dam/usga/pdf/2024-revision/2024-Rules-of-Handicapping-USGA.pdf"
            target="_blank" rel="noopener" class="rules-link">
            {{ $t('currentRules') }}
          </a>
        </p>
      </div>

      <div class="current-index" v-if="storedHandicap !== null">
        <strong>{{ $t('currentHandicap') }}:</strong>
        {{ storedHandicap?.toFixed(1) }}
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

        <div class="form-group">
          <label>{{ $t('handicapIndexLabel') }}</label>
          <input type="number" v-model.number="handicapIndexInput" step="0.1"
            :placeholder="`${$t('forExample')} ${storedHandicap?.toFixed(1) || '0.0'}`" />
        </div>

        <div class="form-group">
          <label>{{ $t('courseRating') }}</label>
          <input type="number" v-model.number="courseRating" step="0.1" required
            :placeholder="`${$t('forExample')} 72.0`" />
        </div>

        <div class="form-group">
          <label>{{ $t('slope') }}</label>
          <input type="number" v-model.number="slope" required />
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

    <div class="card results-card" v-if="results.length">
      <h2>{{ $t('yourResults') }}</h2>
      <button class="btn-secondary" @click="recalculateAll">{{ $t('recalculateHandicap') }}</button>
      <table>
        <thead>
          <tr>
            <th>{{ $t('date') }}</th>
            <th>{{ $t('course') }}</th>
            <th>{{ $t('grossScore') }}</th>
            <th>{{ $t('scoreDifferential') }}</th>
            <th>{{ $t('handicapIndex') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in sortedResults" :key="res.id">
            <td>{{ new Date(res.date).toLocaleDateString() }}</td>
            <td>{{ res.courseName }}</td>
            <td>{{ res.grossScore }}</td>
            <td>{{ res.scoreDifferential.toFixed(1) }}</td>
            <td>{{ res.storedHandicap?.toFixed(1) }}</td>
            <td><button class="btn-delete" @click="deleteResult(res.id)">{{ $t('delete') }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/db'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const holes = ref('')
const handicapIndexInput = ref(0)
const courseRating = ref(null)
const slope = ref(null)
const grossScore = ref(null)
const pccAdjustment = ref(0)
const calculated = ref(false)
const results = ref([])
const showDatePicker = ref(false)
const pickedDate = ref(new Date().toISOString().slice(0, 10))

const scoreDifferential = computed(() => {
  if (!calculated.value) return 0
  if (holes.value === '9') {
    const played9 = (grossScore.value - courseRating.value) * (113 / slope.value)
    const notPlayed9 = handicapIndexInput.value * 0.52 + 1.2
    return parseFloat((played9 + notPlayed9 - 0.5 * pccAdjustment.value).toFixed(1))
  }
  const raw18 = (grossScore.value - courseRating.value) * (113 / slope.value)
  return parseFloat((raw18 - pccAdjustment.value).toFixed(1))
})

const computeHandicap = diffs => {
  const n = diffs.length
  if (n === 0) return 0
  let count, adj
  if (n <= 3) { count = 1; adj = -2.0 }
  else if (n === 4) { count = 1; adj = -1.0 }
  else if (n === 5) { count = 1; adj = 0.0 }
  else if (n === 6) { count = 2; adj = -1.0 }
  else if (n <= 8) { count = 2; adj = 0.0 }
  else if (n <= 11) { count = 3; adj = 0.0 }
  else if (n <= 14) { count = 4; adj = 0.0 }
  else if (n <= 16) { count = 5; adj = 0.0 }
  else if (n <= 18) { count = 6; adj = 0.0 }
  else if (n === 19) { count = 7; adj = 0.0 }
  else { count = 8; adj = 0.0 }
  const avg = diffs.slice(0, count).reduce((a, v) => a + v, 0) / count
  return parseFloat((avg + adj).toFixed(1))
}

const sortedResults = computed(() =>
  [...results.value].sort((a, b) => new Date(b.date) - new Date(a.date))
)

const storedHandicap = computed(() => {
  if (!results.value.length) return null
  return results.value[0].storedHandicap
})

const scoreColorClass = computed(() => {
  if (!calculated.value) return 'score-neutral'
  return scoreDifferential.value < handicapIndexInput.value
    ? 'score-good' : scoreDifferential.value > handicapIndexInput.value
      ? 'score-bad' : 'score-neutral'
})

onMounted(async () => {
  results.value = await db.results.orderBy('date').reverse().toArray()
})

function onCalculate() { calculated.value = true }

function openDatePicker() {
  if (results.value.length > 0) {
    const entered = Number(handicapIndexInput.value.toFixed(1))
    const lastHC = results.value[0].storedHandicap
    if (entered !== lastHC) { alert(t('inconsistentIndex')); return }
  }
  pickedDate.value = new Date().toISOString().slice(0, 10)
  showDatePicker.value = true
}

async function confirmSave() {
  // compute new handicap based on new and old diffs
  const allDiffs = [scoreDifferential.value, ...results.value.map(r => r.scoreDifferential)].sort((a, b) => a - b)
  const newHC = computeHandicap(allDiffs)
  const entry = {
    date: pickedDate.value,
    courseName: `${courseRating.value}/${slope.value}`,
    grossScore: grossScore.value,
    scoreDifferential: scoreDifferential.value,
    storedHandicap: newHC
  }
  const id = await db.results.add(entry)
  results.value.unshift({ id, ...entry })
  calculated.value = false
  handicapIndexInput.value = newHC
  showDatePicker.value = false
}

async function deleteResult(id) {
  await db.results.delete(id)
  results.value = results.value.filter(r => r.id !== id)
  // optionally recompute all stored handicaps:
  await recalculateAll()
}

async function recalculateAll() {
  // recalc sequentially by date ascending
  const ascending = [...results.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  const updated = []
  for (let i = 0; i < ascending.length; i++) {
    const diffs = ascending.slice(0, i + 1).map(r => r.scoreDifferential).sort((a, b) => a - b)
    const hc = computeHandicap(diffs)
    ascending[i].storedHandicap = hc
    await db.results.update(ascending[i].id, { storedHandicap: hc })
    updated.push(ascending[i])
  }
  results.value = updated.sort((a, b) => new Date(b.date) - new Date(a.date))
  handicapIndexInput.value = results.value[0]?.storedHandicap || 0
}

function closeDatePicker() { showDatePicker.value = false }
</script>

<style>
:root {
  --primary: #005f73;
  --accent: #2a9d8f;
  --danger: #e76f51;
  --danger-muted: #e38f7a;
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

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th {
  background: var(--primary);
  color: #fff;
  padding: 8px;
  font-size: 0.8rem;
}

td {
  border: 1px solid #ddd;
  text-align: center;
  padding: 6px;
  font-size: 0.75rem;
}

tbody tr:nth-child(odd) {
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

.btn-delete {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid var(--danger);
  border-radius: 4px;
  color: var(--danger);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-delete:hover {
  background: var(--danger-muted);
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
