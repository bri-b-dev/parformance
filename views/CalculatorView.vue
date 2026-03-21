<template>
  <div class="card calculator-card">
    <LogoIcon class="title" />
    <p class="intro">{{ t('calculatorIntro') }}</p>

    <form @submit.prevent="onCalculate" novalidate>
      <!-- Anzahl Löcher -->
      <div class="form-group">
        <label for="holes">
          {{ t('holesPlayed') }} <span class="required">*</span>
          <!--<InfoTooltip :text="t('holesPlayedTooltip')" />-->
        </label>
        <select id="holes" v-model="holes" required>
          <option value="" disabled>{{ t('chooseOption') }}</option>
          <option value="18">18 {{ t('holes') }}</option>
          <option value="9">9 {{ t('holes') }}</option>
        </select>
        <small v-if="errors.holes" class="error">{{ errors.holes }}</small>
      </div>

      <!-- Handicap Index (Voraus) -->
      <div class="form-group">
        <label for="handicapInput">
          {{ t('handicapIndexLabel') }} <span class="required">*</span>
          <!-- <InfoTooltip :text="t('handicapIndexInfo')" /> -->
        </label>
        <input
          id="handicapInput"
          type="number"
          v-model.number="handicapIndexInput"
          step="0.1"
          :placeholder="storedHandicap !== null ? storedHandicap.toFixed(1) : '0.0'"
        />
        <small v-if="errors.handicapIndex" class="error">{{ errors.handicapIndex }}</small>
      </div>

      <!-- Course Rating -->
      <div class="form-group">
        <label for="courseRating">
          {{ t('courseRating') }} <span class="required">*</span>
          <!-- <InfoTooltip :text="t('courseRatingInfo')" /> -->
        </label>
        <input
          id="courseRating"
          type="number"
          v-model.number="courseRating"
          step="0.1"
          required
          placeholder="72.0"
        />
        <small v-if="errors.courseRating" class="error">{{ errors.courseRating }}</small>
      </div>

      <!-- Slope -->
      <div class="form-group">
        <label for="slope">
          {{ t('slope') }} <span class="required">*</span>
          <!-- <InfoTooltip :text="t('slopeInfo')" /> -->
        </label>
        <input
          id="slope"
          type="number"
          v-model.number="slope"
          required
          placeholder="113"
        />
        <small v-if="errors.slope" class="error">{{ errors.slope }}</small>
      </div>

      <!-- Gross Score -->
      <div class="form-group">
        <label for="grossScore">
          {{ t('grossScore') }} <span class="required">*</span>
          <!-- <InfoTooltip :text="t('grossScoreInfo')" /> -->
        </label>
        <input
          id="grossScore"
          type="number"
          v-model.number="grossScore"
          required
          placeholder="85"
        />
        <small v-if="errors.grossScore" class="error">{{ errors.grossScore }}</small>
      </div>

      <!-- PCC Adjustment -->
      <div class="form-group full-width">
        <label for="pccAdjustment">
          {{ t('pcc') }} <span class="required">*</span>
          <!-- <InfoTooltip :text="t('pccInfo')" /> -->
        </label>
        <input
          id="pccAdjustment"
          type="number"
          v-model.number="pccAdjustment"
          required
          step="0.1"
          min="-1.0"
          max="3.0"
          placeholder="0.0"
        />
        <small class="validation-note">{{ t('pccNote') }}</small>
        <small v-if="errors.pccAdjustment" class="error">{{ errors.pccAdjustment }}</small>
      </div>

      <!-- Buttons -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          :disabled="!formValid"
        >
          {{ t('calculate') }}
        </button>
        <button
          type="button"
          class="btn-secondary"
          @click="onReset"
        >
          {{ t('reset') }}
        </button>
      </div>
    </form>

    <!-- Ergebnis‐Panel -->
    <transition name="fade">
      <div v-if="calculated" class="result-box" :class="scoreClass">
        <p>
          <strong>{{ t('scoreDifferential') }}:</strong>
          {{ scoreDifferential.toFixed(1) }}
        </p>
        <p>
          <strong>{{ t('projectedHandicap') }}:</strong>
          {{ projectedHandicap.toFixed(1) }}
        </p>
        <div class="result-actions">
          <button class="btn-primary" @click="openSaveModal">
            {{ t('saveResult') }}
          </button>
          <button class="btn-secondary" @click="onReset">
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </transition>

    <!-- Save Modal -->
    <div v-if="showSaveModal" class="modal-backdrop">
      <div class="modal">
        <h3>{{ t('saveModalTitle') }}</h3>
        <form @submit.prevent="onConfirmSave">
          <div class="form-group">
            <label for="datePicked">
              {{ t('chooseDate') }} <span class="required">*</span>
            </label>
            <div class="date-input-wrapper">
              <input
                id="datePicked"
                type="date"
                v-model="pickedDate"
                required
              />
              <span class="material-icons calendar-icon">calendar_today</span>
            </div>
            <small v-if="errors.pickedDate" class="error">{{ errors.pickedDate }}</small>
          </div>

          <div class="form-group">
            <label for="courseName">{{ t('courseNameOptional') }}</label>
            <input
              id="courseName"
              type="text"
              v-model="courseName"
              placeholder="z. B. Golfclub Musterstadt"
            />
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary">{{ t('confirm') }}</button>
            <button type="button" class="btn-secondary" @click="closeSaveModal">
              {{ t('cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db, type Result } from '../db'
import InfoTooltip from '@/components/InfoTooltip.vue'
import { computeBaseHandicap, applyCap } from '../utils/calculations'
import LogoIcon from '@/components/IconLogo.vue'

// i18n
const { t } = useI18n()

// Reactive States
const holes = ref('')
const handicapIndexInput = ref<number | null>(null)
const courseRating = ref<number | null>(null)
const slope = ref<number | null>(null)
const grossScore = ref<number | null>(null)
const pccAdjustment = ref(0)

const calculated = ref(false)
const showSaveModal = ref(false)
const pickedDate = ref(new Date().toISOString().slice(0, 10))
const courseName = ref('')

const results = ref<Result[]>([])

// Fehlerobjekt für Inline-Validierung
const errors = ref({
  holes: '',
  handicapIndex: '',
  courseRating: '',
  slope: '',
  grossScore: '',
  pccAdjustment: '',
  pickedDate: ''
})

// gespeicherter Handicap‐Index (letzter Eintrag)
const storedHandicap = computed(() => {
  if (!results.value.length) return null
  return results.value[0].storedHandicap
})

// Score Differential (wie gehabt, nur berechnet, wenn calculated=true)
const scoreDifferential = computed(() => {
  if (!calculated.value) return 0
  const gs = grossScore.value || 0
  const cr = courseRating.value || 0
  const sl = slope.value || 113
  const hi = handicapIndexInput.value || 0

  if (holes.value === '9') {
    const played9 = (gs - cr) * (113 / sl)
    const notPlayed9 = ((hi * 1.04) + 2.4) / 2.0
    return parseFloat((played9 + notPlayed9 - 0.5 * pccAdjustment.value).toFixed(1))
  }
  const raw18 = (gs - cr) * (113 / sl)
  return parseFloat((raw18 - pccAdjustment.value).toFixed(1))
})

// Projektion des Handicap‐Index (gleiche Logik wie recalcAll, nur einmalig für neueste Runde)
const projectedHandicap = computed(() => {
  // Einfache Näherung: nehme alle bisherigen scoreDifferentials plus den neuen, sortiere und wende computeBaseHandicap/applyCap an.
  const existing = results.value.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  // Build Array aller bisherigen diffs
  const diffs = existing.map(r => r.scoreDifferential)
  // Füge aktuellen Diff ein und sortiere
  const combined = [...diffs, scoreDifferential.value].sort((a, b) => a - b)
  // computeBaseHandicap
  const hcRaw = computeBaseHandicap(combined, storedHandicap.value)
  // applyCap auf virtuellen neuen Eintrag
  const pseudoRecords = [
    ...existing,
    {
      date: pickedDate.value,
      courseName: String(courseRating.value) + '/' + String(slope.value),
      grossScore: grossScore.value || 0,
      scoreDifferential: scoreDifferential.value,
      storedHandicap: hcRaw,
      id: Date.now() // temporary ID
    }
  ]
  const idx = pseudoRecords.length - 1
  return applyCap(hcRaw, pseudoRecords, idx)
})

// CSS-Klasse, um Ergebnis‐Box farblich zu markieren
const scoreClass = computed(() => {
  if (!calculated.value) return ''
  const hi = handicapIndexInput.value || 0
  return scoreDifferential.value < hi
    ? 'score-good'
    : scoreDifferential.value > hi
      ? 'score-bad'
      : 'score-neutral'
})

// Prüfen, ob Formular valide ist (einfachste Variante)
const formValid = computed(() => {
  return (
    holes.value &&
    (courseRating.value || 0) > 0 &&
    (slope.value || 0) > 0 &&
    (grossScore.value || 0) > 0 &&
    pccAdjustment.value !== null
  )
})

// Beim Mount alle bisherigen Ergebnisse laden
onMounted(async () => {
  results.value = await db.results.orderBy('date').reverse().toArray()
  if (results.value.length) {
    handicapIndexInput.value = storedHandicap.value ?? 0
  }
})

// Validierungs­funktion (vor onCalculate)
function validateForm() {
  // Reset
  Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))

  let ok = true
  if (!holes.value) {
    errors.value.holes = t('errorHolesRequired')
    ok = false
  }
  if (
    handicapIndexInput.value !== null &&
    (handicapIndexInput.value < 0 || isNaN(handicapIndexInput.value))
  ) {
    errors.value.handicapIndex = t('errorHandicapInvalid')
    ok = false
  }
  if (!courseRating.value || courseRating.value <= 0) {
    errors.value.courseRating = t('errorCourseRating')
    ok = false
  }
  if (!slope.value || slope.value <= 0) {
    errors.value.slope = t('errorSlope')
    ok = false
  }
  if (!grossScore.value || grossScore.value <= 0) {
    errors.value.grossScore = t('errorGrossScore')
    ok = false
  }
  if (
    pccAdjustment.value === null ||
    isNaN(pccAdjustment.value) ||
    pccAdjustment.value < -1.0 ||
    pccAdjustment.value > 3.0
  ) {
    errors.value.pccAdjustment = t('errorPccInvalid')
    ok = false
  }
  return ok
}

// “Berechnen”-Button
function onCalculate() {
  if (!validateForm()) return
  calculated.value = true
}

// Reset‐Funktion
function onReset() {
  holes.value = ''
  handicapIndexInput.value = storedHandicap.value ?? null
  courseRating.value = null
  slope.value = null
  grossScore.value = null
  pccAdjustment.value = 0
  calculated.value = false
  showSaveModal.value = false
  pickedDate.value = new Date().toISOString().slice(0, 10)
  courseName.value = ''
  Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))
}

// Modal öffnen
function openSaveModal() {
  // Prüfen, ob eingegebener HI mit gespeichertem übereinstimmt
  if (
    results.value.length &&
    Number((handicapIndexInput.value || 0).toFixed(1)) !== results.value[0].storedHandicap
  ) {
    // Inconsistency
    errors.value.handicapIndex = t('inconsistentIndex')
    return
  }
  pickedDate.value = new Date().toISOString().slice(0, 10)
  showSaveModal.value = true
}

// Modal schließen
function closeSaveModal() {
  showSaveModal.value = false
  errors.value.pickedDate = ''
}

// Konkretes Speichern
async function onConfirmSave() {
  if (!pickedDate.value) {
    errors.value.pickedDate = t('errorDateRequired')
    return
  }
  const entry = {
    date: pickedDate.value,
    courseName: courseName.value || `${courseRating.value}/${slope.value}`,
    grossScore: grossScore.value || 0,
    scoreDifferential: scoreDifferential.value,
    storedHandicap: 0 // wird in recalcAll überschrieben
  }
  const id = await db.results.add(entry)
  results.value.unshift({ id, ...entry })
  await recalcAll()
  calculated.value = false
  handicapIndexInput.value = results.value[0].storedHandicap
  showSaveModal.value = false
}

// Recalculate All (analog zu App.vue-Logik)
async function recalcAll() {
  const ascending = [...results.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let prevHC = null
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

</script>

<style scoped>
.calculator-card {
  max-width: 500px;
  margin: 2rem auto;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.75rem;
}

.intro {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-muted);
  font-size: 1.05rem;
  line-height: 1.5;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Modal */
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
  margin-bottom: 1.5rem;
}

.date-input-wrapper {
  position: relative;
}

.calendar-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--text-muted);
  pointer-events: none;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
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
