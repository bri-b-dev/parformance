<template>
  <div>
    <!-- Statistiken oben -->
    <div class="card stats-card">
      <h2 class="card-title">{{ t('yourStats') }}</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">{{ t('lastHandicap') }}:</span>
          <span class="stat-value">
            {{ lastHandicap !== null ? lastHandicap.toFixed(1) : '-' }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('roundCount') }}:</span>
          <span class="stat-value">{{ results.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('lowestHI12mo') }}:</span>
          <span class="stat-value">
            {{ lowestHI12mo !== null ? lowestHI12mo.toFixed(1) : '-' }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('avgDiff5') }}:</span>
          <span class="stat-value">
            {{ avgDiff5 !== null ? avgDiff5.toFixed(1) : '-' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card chart-card" v-if="results.length">
      <h2 class="card-title">{{ t('handicapChartTitle') }}</h2>
      <HandicapChart :data="sortedResultsForChart" />
    </div>

    <!-- Tabelle mit erweiterten Spalten -->
    <div class="card table-card" v-if="results.length">
      <h2 class="card-title">{{ t('yourResults') }}</h2>
      <button class="btn-secondary recalc-btn" @click="recalculateAll">
        {{ t('recalculateHandicap') }}
      </button>
      <table>
        <thead>
          <tr>
            <th>{{ t('date') }}</th>
            <th>{{ t('course') }}</th>
            <th>{{ t('diffShort') }}</th>
            <th>{{ t('hiShort') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="res in sortedResults"
            :key="res.id"
            @click="openDetail(res)"
            class="clickable-row"
          >
            <td>{{ formatDate(res.date) }}</td>
            <td>
              <span class="course-name" :title="res.courseName">
                {{ res.courseName }}
              </span>
            </td>
            <td>{{ res.scoreDifferential.toFixed(1) }}</td>
            <td>{{ res.storedHandicap.toFixed(1) }}</td>
            <td>
              <button class="btn-delete" @click.stop="openDeleteConfirm(res.id)">
                {{ t('delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete-Confirm Modal -->
    <div v-if="showDeleteConfirm" class="modal-backdrop">
      <div class="modal">
        <h3>{{ t('confirmDeleteTitle') }}</h3>
        <p>{{ t('confirmDeleteMessage') }}</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="confirmDelete">
            {{ t('confirm') }}
          </button>
          <button class="btn-secondary" @click="cancelDelete">
            {{ t('cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail-Modal (öffnet beim Klick auf eine Tabellenzeile) -->
    <div v-if="showDetailModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ t('detailTitle') }}</h3>
        <div class="detail-content">
          <p>
            <strong>{{ t('date') }}:</strong> {{ formatDate(detailEntry.date) }}
          </p>
          <p>
            <strong>{{ t('course') }}:</strong>
            <span v-if="hasCustomCourseName(detailEntry.courseName)">
              {{ detailEntry.courseName }}
            </span>
            <span v-else>
              {{ parseCourseRating(detailEntry.courseName) }}/
              {{ parseSlope(detailEntry.courseName) }}
            </span>
          </p>
          <p>
            <strong>{{ t('grossScore') }}:</strong> {{ detailEntry.grossScore }}
          </p>
          <p>
            <strong>{{ t('scoreDifferential') }}:</strong>
            {{ detailEntry.scoreDifferential.toFixed(1) }}
          </p>
          <p>
            <strong>{{ t('handicapIndexShort') }}:</strong>
            {{ detailEntry.storedHandicap.toFixed(1) }}
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeDetail">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import HandicapChart from '@/components/HandicapChart.vue'
import { db } from '@/db'
import { computeBaseHandicap } from '@/utils/calculations.ts'

// i18n
const { t, locale } = useI18n()

// States
const results = ref([])
const showDeleteConfirm = ref(false)
const deleteTargetId = ref(null)

const showDetailModal = ref(false)
const detailEntry = ref(null)

// Beim Mount alle bisherigen Ergebnisse laden
onMounted(async () => {
  results.value = await db.results.orderBy('date').reverse().toArray()
})

// Sortierte Listen
const sortedResults = computed(() =>
  [...results.value].sort((a, b) => new Date(b.date) - new Date(a.date))
)

const sortedResultsForChart = computed(() =>
  [...results.value]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(r => ({
      x: new Date(r.date),
      yDiff: r.scoreDifferential,
      yHC: r.storedHandicap
    }))
)

// Statistiken
const lastHandicap = computed(() => {
  if (!results.value.length) return null
  return results.value[0].storedHandicap
})

const lowestHI12mo = computed(() => {
  if (!results.value.length) return null
  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)
  const pastYear = results.value.filter(r => new Date(r.date) >= oneYearAgo)
  if (!pastYear.length) return null
  return Math.min(...pastYear.map(r => r.storedHandicap))
})

const avgDiff5 = computed(() => {
  if (results.value.length < 1) return null
  const last5 = results.value.slice(0, 5).map(r => r.scoreDifferential)
  const sum = last5.reduce((a, b) => a + b, 0)
  return sum / last5.length
})

// Formatierung für Datum
function formatDate(raw) {
  return new Date(raw).toLocaleDateString(locale.value)
}

// Parsing von courseName (z.B. "72/113")
function parseCourseRating(courseName) {
  if (!courseName) return '-'
  const parts = courseName.split('/')
  return parts[0] || '-'
}
function parseSlope(courseName) {
  if (!courseName) return '-'
  const parts = courseName.split('/')
  return parts[1] || '-'
}

// Prüfe, ob ein benutzerdefinierter Kursname (kein "72/113") vorliegt
function hasCustomCourseName(courseName) {
  // Wenn courseName keinen Slash oder mehr als einen Slash hat,
  // oder einer der beiden Werte keine Zahl ist, behandeln wir es als Custom.
  if (!courseName.includes('/')) return true
  const parts = courseName.split('/')
  return parts.length !== 2 || isNaN(Number(parts[0])) || isNaN(Number(parts[1]))
}

// Delete-Modal-Handling
function openDeleteConfirm(id) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}
function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}
async function confirmDelete() {
  await db.results.delete(deleteTargetId.value)
  results.value = results.value.filter(r => r.id !== deleteTargetId.value)
  showDeleteConfirm.value = false
  deleteTargetId.value = null
  await recalcAll()
}

// Recalculate All (wie in CalculatorView)
async function recalcAll() {
  const ascending = [...results.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  let prevHC = null
  for (let i = 0; i < ascending.length; i++) {
    const diffs = ascending
      .slice(0, i + 1)
      .map(r => r.scoreDifferential)
      .sort((a, b) => a - b)
    let hc = computeBaseHandicap(diffs, prevHC)
    hc = applyCap(hc, ascending, i)
    ascending[i].storedHandicap = hc
    await db.results.update(ascending[i].id, { storedHandicap: hc })
    prevHC = hc
  }
  results.value = ascending.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Detail-Modal-Handling
function openDetail(entry) {
  detailEntry.value = entry
  showDetailModal.value = true
}
function closeDetail() {
  showDetailModal.value = false
  detailEntry.value = null
}

/* ----- Hilfsfunktionen zur Handicap‐Berechnung (kopiere aus deinem Original‐Code) ----- */
// function computeBaseHandicap(diffs, prevHC = null) {
//   const n = diffs.length
//   if (n === 0) return 0
//   let count, adj
//   if (n <= 3) { count = 1; adj = -2.0 }
//   else if (n === 4) { count = 1; adj = -1.0 }
//   else if (n === 5) { count = 1; adj = 0.0 }
//   else if (n === 6) { count = 2; adj = -1.0 }
//   else if (n <= 8) { count = 2; adj = 0.0 }
//   else if (n <= 11) { count = 3; adj = 0.0 }
//   else if (n <= 14) { count = 4; adj = 0.0 }
//   else if (n <= 16) { count = 5; adj = 0.0 }
//   else if (n <= 18) { count = 6; adj = 0.0 }
//   else if (n === 19) { count = 7; adj = 0.0 }
//   else { count = 8; adj = 0.0 }
//   const avg = diffs.slice(0, count).reduce((sum, v) => sum + v, 0) / count
//   let hc = parseFloat((avg + adj).toFixed(1))
//   if (prevHC !== null && prevHC >= 26.5 && prevHC <= 54 && hc > prevHC) {
//     hc = prevHC
//   }
//   return hc
// }

function applyCap(newHC, allRecords, currentIndex) {
  const currentDate = new Date(allRecords[currentIndex].date)
  const oneYearAgo = new Date(currentDate)
  oneYearAgo.setDate(currentDate.getDate() - 365)

  const past = allRecords
    .slice(0, currentIndex)
    .filter(r => new Date(r.date) >= oneYearAgo)
  const lowHI = past.length
    ? Math.min(...past.map(r => r.storedHandicap))
    : newHC

  const diff = newHC - lowHI
  if (diff <= 3) return newHC

  const soft = lowHI + 3
  const extra = diff - 3
  const softIncrease = 3 + extra / 2
  if (softIncrease <= 5) {
    return parseFloat((lowHI + softIncrease).toFixed(1))
  }
  return lowHI + 5
}
</script>

<style scoped>
/* Card-Überschriften etc. wie gehabt */
.card {
  background: var(--bg-card);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-top: 1rem;
}
.card-title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: var(--primary);
}

/* Stats-Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}
.stat-item {
  background: #f9f9fb;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: center;
}
.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-top: 0.25rem;
}

/* Chart-Container */
.chart-card {
  position: relative;
  height: 300px;
  margin-top: 1rem;
}

/* Tabelle */
.table-card {
  margin-top: 1rem;
  overflow-x: auto;
}
.table-card table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.table-card th {
  background: var(--primary);
  color: #ffffff;
  padding: 8px;
  font-size: 0.8rem;
}
.table-card td {
  border: 1px solid #dddddd;
  text-align: center;
  padding: 6px;
  font-size: 0.75rem;
}
.table-card tbody tr:nth-child(odd) {
  background: #f9f9fb;
}
/* Hover- und Klick-Effekt */
.table-card tr:hover {
  background: #e8f8f5;
}
.clickable-row {
  cursor: pointer;
}

/* Buttons */
.recalc-btn {
  margin-bottom: 0.5rem;
}
.btn-delete {
  background: transparent;
  border: 2px solid var(--danger);
  border-radius: 4px;
  color: var(--danger);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-delete:hover {
  background: var(--danger);
  color: #ffffff;
}

/* Modal (Delete und Detail) */
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
  z-index: 20;
}
.modal {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 340px;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

/* Detail-Modal‐Inhalt */
.detail-content p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}
</style>
