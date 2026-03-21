<template>
  <div>
    <!-- statistics -->
    <div class="card stats-card">
      <h1 class="card-title">{{ t('yourStats') }}</h1>
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

    <!-- chart -->
    <div class="card chart-card" v-if="results.length">
      <h1 class="card-title">{{ t('handicapChartTitle') }}</h1>
      <HandicapChart :data="sortedResultsForChart" />
    </div>

    <!-- table with extended columns -->
    <div class="card table-card" v-if="results.length">
      <h1 class="card-title">{{ t('yourResults') }}</h1>
      <button class="btn-secondary recalc-btn" @click="recalcAll">
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
              <button class="btn-delete" @click.stop="openDeleteConfirm(res.id!)">
                {{ t('delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- delete-confirm-modal -->
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

    <!-- detail-modal (opend uppon clicking on a table-row) -->
    <div v-if="showDetailModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ t('detailTitle') }}</h3>
        <div class="detail-content" v-if="detailEntry">
          <p>
            <strong>{{ t('date') }}:</strong> {{ formatDate(detailEntry.date) }}
          </p>
          <p>
            <strong>{{ t('course') }}: </strong>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import HandicapChart from '../components/HandicapChart.vue'
import { db, type Result } from '../db'
import { computeBaseHandicap, applyCap } from '../utils/calculations'

// i18n
const { t, locale } = useI18n()

// states
const results = ref<Result[]>([])
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

const showDetailModal = ref(false)
const detailEntry = ref<Result | null>(null)

// load results from db
onMounted(async () => {
  results.value = await db.results.orderBy('date').reverse().toArray()
})

// sort lists
const sortedResults = computed(() =>
  [...results.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const sortedResultsForChart = computed(() =>
  [...results.value]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: r.date,
      scoreDifferential: r.scoreDifferential,
      storedHandicap: r.storedHandicap
    }))
)


// statistics
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
  return Math.min(...pastYear.map(r => r.storedHandicap || 0))
})

const avgDiff5 = computed(() => {
  if (results.value.length < 1) return null
  const last5 = results.value.slice(0, 5).map(r => r.scoreDifferential)
  const sum = last5.reduce((a, b) => a + b, 0)
  return sum / last5.length
})

// date formatting
function formatDate(raw: string | number | Date) {
  return new Date(raw).toLocaleDateString(locale.value)
}

// parsing of course-name (e.g. "72/113")
function parseCourseRating(courseName: string) {
  if (!courseName) return '-'
  const parts = courseName.split('/')
  return parts[0] || '-'
}
function parseSlope(courseName: string) {
  if (!courseName) return '-'
  const parts = courseName.split('/')
  return parts[1] || '-'
}

// check if a custom course name (not "72/113") is given
function hasCustomCourseName(courseName: string) {
  // if courseName has no slash or more than one slash,
  // or one of the two parts is not a number, we treat it as custom.
  if (!courseName.includes('/')) return true
  const parts = courseName.split('/')
  return parts.length !== 2 || isNaN(Number(parts[0])) || isNaN(Number(parts[1]))
}

// delete-confirm-modal handling
function openDeleteConfirm(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}
function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}
async function confirmDelete() {
  if (deleteTargetId.value !== null) {
    await db.results.delete(deleteTargetId.value)
  }
  results.value = results.value.filter(r => r.id !== deleteTargetId.value)
  showDeleteConfirm.value = false
  deleteTargetId.value = null
  await recalcAll()
}

// recalculate all handicaps from scratch
async function recalcAll() {
  const ascending = [...results.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let prevHC: number | null = null
  for (let i = 0; i < ascending.length; i++) {
    const diffs = ascending
      .slice(0, i + 1)
      .map(r => r.scoreDifferential)
      .sort((a, b) => a - b)
    let hc = computeBaseHandicap(diffs, prevHC)
    hc = applyCap(hc, ascending, i)
    ascending[i].storedHandicap = hc
    if (ascending[i].id !== undefined) {
      await db.results.update(ascending[i].id!, { storedHandicap: hc })
    }
    prevHC = hc
  }
  results.value = ascending.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// detail modal handling
function openDetail(entry: Result) {
  detailEntry.value = entry
  showDetailModal.value = true
}
function closeDetail() {
  showDetailModal.value = false
  detailEntry.value = null
}

</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: 1rem;
}

.stat-item {
  background: #ffffff;
  padding: 1rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0.5rem;
}

/* chart-container */
.chart-card {
  position: relative;
  height: 320px;
  margin-top: 1.5rem;
}

.table-card {
  margin-top: 1.5rem;
  width: 100%;
  overflow-x: auto;
}

.table-card table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
  margin-top: 1rem;
  border-radius: var(--input-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-card th {
  background: var(--primary);
  color: #ffffff;
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  letter-spacing: 0.5px;
}
.table-card th:not(:first-child) {
  text-align: center;
}

.table-card td {
  border-bottom: 1px solid var(--border);
  background: #ffffff;
  text-align: center;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: var(--text);
  transition: background 0.2s;
}

.table-card td:first-child {
  text-align: left;
  font-weight: 500;
}

.table-card tbody tr:last-child td {
  border-bottom: none;
}

.table-card tbody tr:hover td {
  background: #f8fafc;
}

.course-name {
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  border-bottom: 1px dashed var(--primary-light);
}

.btn-delete {
  background: transparent;
  border: 1px solid var(--danger-muted);
  border-radius: 6px;
  color: var(--danger);
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: var(--danger);
  color: #ffffff;
  border-color: var(--danger);
  transform: scale(1.05);
}

.clickable-row td {
  cursor: pointer;
}

/*------------------------------
  Modal / Overlays
-------------------------------*/
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.25s ease-out;
}

.modal {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius);
  width: 90%;
  max-width: 380px;
  box-shadow: var(--shadow-lg);
  transform: translateY(0);
  animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal h3 {
  margin-top: 0;
  color: var(--primary);
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.detail-content p {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 0;
  font-size: 0.95rem;
}

.detail-content p:last-child {
  border-bottom: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlide {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
