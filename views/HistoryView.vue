<template>
  <div>
    <!-- hidden file input for PDF import -->
    <input
      ref="pdfFileInput"
      type="file"
      accept=".pdf,application/pdf"
      style="display:none"
      @change="onPdfSelected"
    />

    <!-- notice after the calculation was corrected -->
    <div v-if="recalcNotice" class="import-message success">
      {{ t('recalcNotice') }} {{ recalcNotice }}
      <button class="btn-secondary" @click="dismissRecalcNotice">{{ t('close') }}</button>
    </div>

    <!-- statistics -->
    <div class="card stats-card">
      <div class="stats-header">
        <h1 class="card-title">{{ t('yourStats') }}</h1>
        <button class="btn-import" @click="triggerPdfImport" :disabled="importLoading">
          <span class="material-icons" style="font-size:1.1rem;vertical-align:middle;margin-right:4px">upload_file</span>
          {{ importLoading ? t('importLoading') : t('importPdf') }}
        </button>
      </div>
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
          </tr>
        </tbody>
      </table>
    </div>

    <!-- import-error/success message -->
    <transition name="fade">
      <div v-if="importMessage" class="import-message" :class="importMessageType">
        {{ importMessage }}
      </div>
    </transition>

    <!-- import preview modal -->
    <div v-if="showImportModal" class="modal-backdrop">
      <div class="modal modal-wide">
        <h3>{{ t('importModalTitle') }}</h3>
        <p class="import-info">{{ t('importPreviewInfo') }}</p>

        <div v-if="parsedRounds.length === 0" class="import-empty">
          {{ t('importNothingFound') }}
        </div>

        <div v-else class="import-table-wrap">
          <table class="import-table">
            <thead>
              <tr>
                <th><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
                <th>{{ t('date') }}</th>
                <th>{{ t('course') }}</th>
                <th>{{ t('importColHoles') }}</th>
                <th>{{ t('importColCR') }}</th>
                <th>{{ t('importColSlope') }}</th>
                <th>{{ t('importColGBE') }}</th>
                <th>{{ t('importColSD') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in parsedRounds"
                :key="idx"
                :class="{ 'row-duplicate': row.isDuplicate }"
              >
                <td>
                  <input
                    type="checkbox"
                    v-model="row.selected"
                    :disabled="row.isDuplicate"
                  />
                </td>
                <td>{{ formatDate(row.date) }}</td>
                <td class="course-col">{{ row.courseName }}</td>
                <td>{{ row.holes }}</td>
                <td>{{ row.cr }}</td>
                <td>{{ row.slope }}</td>
                <td>{{ row.gbe }}</td>
                <td>{{ row.sd.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-actions">
          <button
            v-if="parsedRounds.length > 0"
            class="btn-primary"
            @click="confirmImport"
            :disabled="selectedCount === 0"
          >
            {{ t('importConfirm') }}
            <span v-if="selectedCount > 0">({{ selectedCount }})</span>
          </button>
          <button class="btn-secondary" @click="cancelImport">{{ t('importCancel') }}</button>
        </div>
      </div>
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
          <button class="btn-delete" @click="openDeleteConfirmFromDetail">
            {{ t('delete') }}
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
import { type Result } from '../db'
import { useResults } from '../composables/useResults'
import { parsePdf, computeScoreDifferential, type ImportedRound } from '../utils/pdfParser'

// i18n
const { t } = useI18n()

// states
const { results, recalcNotice, dismissRecalcNotice, load, addMany, remove, recalc: recalcAll } = useResults()
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)

const showDetailModal = ref(false)
const detailEntry = ref<Result | null>(null)

// PDF import state
const pdfFileInput = ref<{ click(): void } | null>(null)
const showImportModal = ref(false)
const importLoading = ref(false)
const importMessage = ref('')
const importMessageType = ref<'success' | 'error'>('success')

interface ParsedRow extends ImportedRound {
  sd: number
  selected: boolean
  isDuplicate: boolean
}
const parsedRounds = ref<ParsedRow[]>([])

const allSelected = computed(() =>
  parsedRounds.value.filter(r => !r.isDuplicate).every(r => r.selected)
)
const selectedCount = computed(() =>
  parsedRounds.value.filter(r => r.selected).length
)

function toggleAll(e: Event) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checked = (e.target as any).checked as boolean
  parsedRounds.value.forEach(r => { if (!r.isDuplicate) r.selected = checked })
}

function triggerPdfImport() {
  importMessage.value = ''
  pdfFileInput.value?.click()
}

async function onPdfSelected(e: Event) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input = e.target as any
  const file = input.files?.[0]
  if (!file) return
  input.value = '' // reset so same file can be re-selected

  importLoading.value = true
  try {
    const raw = await parsePdf(file)
    if (raw.length === 0) {
      importMessage.value = t('importNothingFound')
      importMessageType.value = 'error'
      importLoading.value = false
      return
    }

    // Mark duplicates:
    // - Results with importKey: match by importKey (exact, format-stable)
    // - Results without importKey (manually entered or old imports): fall back to date match
    const importedKeySet = new Set(
      results.value.flatMap(r => r.importKey ? [r.importKey] : [])
    )
    const datesWithoutImportKey = new Set(
      results.value.filter(r => !r.importKey).map(r => r.date)
    )
    parsedRounds.value = raw.map(r => {
      const sd = computeScoreDifferential(r)
      const key = `${r.date}|${r.courseName}`
      const isDuplicate = importedKeySet.has(key) || datesWithoutImportKey.has(r.date)
      return { ...r, sd, selected: !isDuplicate, isDuplicate }
    })
    showImportModal.value = true
  } catch {
    importMessage.value = t('importError')
    importMessageType.value = 'error'
  } finally {
    importLoading.value = false
  }
}

function cancelImport() {
  showImportModal.value = false
  parsedRounds.value = []
}

async function confirmImport() {
  const toImport = parsedRounds.value.filter(r => r.selected && !r.isDuplicate)
  const skipped  = parsedRounds.value.filter(r => r.isDuplicate).length

  await addMany(
    toImport.map(row => ({
      date: row.date,
      courseName: row.courseName,
      grossScore: row.gbe,
      scoreDifferential: row.sd,
      storedHandicap: 0,  // filled in by recalc
      importKey: `${row.date}|${row.courseName}`
    }))
  )

  showImportModal.value = false
  parsedRounds.value = []

  const parts: string[] = []
  if (toImport.length > 0) {
    parts.push(`${toImport.length} ${t('importSuccess')}`)
  }
  if (skipped > 0) {
    parts.push(`${skipped} ${t('importDuplicateSkipped')}`)
  }
  if (parts.length === 0) {
    parts.push(t('importNothingFound'))
  }
  importMessage.value = parts.join(' ')
  importMessageType.value = toImport.length > 0 ? 'success' : 'error'
  setTimeout(() => { importMessage.value = '' }, 5000)
}

// load results from db
onMounted(load)

// sort lists
const sortedResults = results

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

// date formatting - always DD.MM.YYYY to avoid timezone off-by-one on ISO strings
function formatDate(raw: string | number | Date) {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-')
    return `${d}.${m}.${y}`
  }
  return new Date(raw).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  return parts.length !== 2 || Number.isNaN(Number(parts[0])) || Number.isNaN(Number(parts[1]))
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
  const id = deleteTargetId.value
  showDeleteConfirm.value = false
  deleteTargetId.value = null
  if (id !== null) await remove(id)
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
function openDeleteConfirmFromDetail() {
  const id = detailEntry.value?.id
  if (id !== undefined) {
    closeDetail()
    openDeleteConfirm(id)
  }
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

/* ---- Import Button ---- */
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0;
}

.stats-header .card-title {
  margin: 0;
}

.btn-import {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: var(--input-radius);
  border: 1.5px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-import:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.btn-import:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---- Import status message ---- */
.import-message {
  margin: 0.75rem 0;
  padding: 0.75rem 1rem;
  border-radius: var(--input-radius);
  font-size: 0.9rem;
  font-weight: 500;
}

.import-message.success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #6ee7b7;
}

.import-message.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

/* ---- Import preview modal ---- */
.modal-wide {
  max-width: 760px !important;
  width: 95% !important;
}

.import-info {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.import-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 1rem 0;
}

.import-table-wrap {
  overflow-x: auto;
  margin-bottom: 1rem;
  max-height: 55vh;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--input-radius);
}

.import-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.import-table th {
  background: var(--primary);
  color: #fff;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.import-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.import-table tbody tr:last-child td {
  border-bottom: none;
}

.import-table .course-col {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-duplicate td {
  opacity: 0.45;
  font-style: italic;
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
