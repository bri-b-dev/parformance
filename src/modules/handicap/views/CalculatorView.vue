<template>
  <div class="card calculator-card">
    <LogoIcon class="title" />
    <p class="intro">{{ t('calculatorIntro') }}</p>

    <form @submit.prevent="onCalculate" novalidate>
      <!-- Platz-Vorlage -->
      <div class="form-group" v-if="templates.length">
        <label for="template">{{ t('templateSelect') }}</label>
        <select id="template" :value="templateId ?? ''" @change="onTemplateChange">
          <option value="">{{ t('templateNone') }}</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ templateLabel(tpl) }}</option>
        </select>
      </div>

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
          @input="handicapIsOwn = false"
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
        <p v-if="!isProxy">
          <strong>{{ t('projectedHandicap') }}:</strong>
          {{ projectedHandicap.toFixed(1) }}
        </p>
        <p v-else class="proxy-note">{{ t('proxyNote') }}</p>
        <div class="result-actions">
          <button v-if="!isProxy" class="btn-primary" @click="openSaveModal">
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

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="saveAsTemplate" />
              {{ t('saveAsTemplate') }}
            </label>
            <input
              v-if="saveAsTemplate"
              type="text"
              v-model="templateTee"
              :placeholder="t('templateTeePlaceholder')"
              :aria-label="t('templateTee')"
            />
            <small v-if="errors.template" class="error">{{ errors.template }}</small>
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
import { useResults } from '../composables/useResults'
import { useCourseTemplates } from '../composables/useCourseTemplates'
import { templateLabel } from '../utils/courseTemplate'
import { useCalculatorDraft } from '../composables/useCalculatorDraft'
import { projectHandicap } from '../utils/handicap'
import LogoIcon from '@/components/IconLogo.vue'

// i18n
const { t } = useI18n()

// Reactive States
// Eingaben bleiben beim Seitenwechsel erhalten (Draft, sessionStorage)
const {
  holes,
  handicapIndexInput,
  handicapIsOwn,
  templateId,
  courseRating,
  slope,
  grossScore,
  pccAdjustment,
  reset: resetDraft
} = useCalculatorDraft()

const calculated = ref(false)
const showSaveModal = ref(false)
const pickedDate = ref(new Date().toISOString().slice(0, 10))
const courseName = ref('')
const saveAsTemplate = ref(false)
const templateTee = ref('')

const { templates, load: loadTemplates, add: addTemplate } = useCourseTemplates()
const selectedTemplate = computed(() => templates.value.find(tpl => tpl.id === templateId.value) ?? null)

const { results, storedHandicap, load, add } = useResults()

// Fehlerobjekt für Inline-Validierung
const errors = ref({
  holes: '',
  handicapIndex: '',
  courseRating: '',
  slope: '',
  grossScore: '',
  pccAdjustment: '',
  pickedDate: '',
  template: ''
})

// Fremdberechnung: eingegebener HCPI weicht vom gespeicherten ab -> nur Score Differential
const isProxy = computed(
  () =>
    storedHandicap.value !== null &&
    Number((handicapIndexInput.value || 0).toFixed(1)) !== storedHandicap.value
)

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

// Projektion des Handicap-Index mit der neuen Runde
const projectedHandicap = computed(() =>
  projectHandicap(results.value, {
    date: pickedDate.value,
    scoreDifferential: scoreDifferential.value
  })
)

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
  await Promise.all([load(), loadTemplates()])
  // eigener HCPI wird aktuell gehalten; ein eingetippter (fremder) bleibt erhalten
  if (handicapIsOwn.value) {
    handicapIndexInput.value = storedHandicap.value
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

// Vorlage wählen: Felder vorbelegen (bleiben überschreibbar)
function onTemplateChange(e: Event) {
  const id = Number(((e.target ?? { value: '' }) as unknown as { value: string }).value)
  const tpl = templates.value.find(x => x.id === id)
  templateId.value = tpl?.id ?? null
  if (!tpl) return
  holes.value = String(tpl.holes)
  courseRating.value = tpl.courseRating
  slope.value = tpl.slope
}

// “Berechnen”-Button
function onCalculate() {
  if (!validateForm()) return
  calculated.value = true
}

// Reset‐Funktion
function onReset() {
  resetDraft()
  handicapIndexInput.value = storedHandicap.value
  calculated.value = false
  showSaveModal.value = false
  pickedDate.value = new Date().toISOString().slice(0, 10)
  courseName.value = ''
  saveAsTemplate.value = false
  templateTee.value = ''
  Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))
}

// Modal öffnen
function openSaveModal() {
  if (isProxy.value) return
  pickedDate.value = new Date().toISOString().slice(0, 10)
  if (!courseName.value && selectedTemplate.value) courseName.value = selectedTemplate.value.name
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
  if (saveAsTemplate.value && !courseName.value.trim()) {
    errors.value.template = t('templateNeedsName')
    return
  }
  errors.value.template = ''
  // tee/par only if the fields still match the selected template
  const tpl = selectedTemplate.value
  const sameAsTemplate =
    !!tpl &&
    tpl.holes === Number(holes.value) &&
    tpl.courseRating === courseRating.value &&
    tpl.slope === slope.value
  const entry = {
    date: pickedDate.value,
    courseName: courseName.value || `${courseRating.value}/${slope.value}`,
    grossScore: grossScore.value || 0,
    scoreDifferential: scoreDifferential.value,
    storedHandicap: 0, // wird beim Neuberechnen gesetzt
    holes: Number(holes.value),
    courseRating: courseRating.value ?? undefined,
    slope: slope.value ?? undefined,
    pcc: pccAdjustment.value,
    tee: sameAsTemplate ? tpl.tee || undefined : saveAsTemplate.value ? templateTee.value.trim() || undefined : undefined,
    par: sameAsTemplate ? tpl.par : undefined
  }
  if (saveAsTemplate.value) {
    await addTemplate({
      name: courseName.value.trim(),
      tee: templateTee.value.trim(),
      holes: Number(holes.value),
      courseRating: courseRating.value as number,
      slope: slope.value as number
    })
  }
  await add(entry)
  onReset()
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label input {
  width: auto;
}

.proxy-note {
  color: var(--text-muted);
  font-size: 0.9rem;
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
