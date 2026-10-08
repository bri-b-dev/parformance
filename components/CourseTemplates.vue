<template>
  <div class="course-templates">
    <label>{{ t('templatesTitle') }}</label>
    <p v-if="!templates.length && !editing" class="templates-empty">{{ t('templatesEmpty') }}</p>

    <ul v-if="templates.length" class="template-list">
      <li v-for="tpl in templates" :key="tpl.id" class="template-item">
        <div class="template-info">
          <strong>{{ templateLabel(tpl) }}</strong>
          <span class="template-values">
            CR {{ tpl.courseRating }} · Slope {{ tpl.slope }}<template v-if="tpl.par"> · Par {{ tpl.par }}</template>
          </span>
        </div>
        <div class="template-actions" v-if="confirmDeleteId !== tpl.id">
          <button type="button" class="btn-secondary" @click="startEdit(tpl)">{{ t('templateEdit') }}</button>
          <button type="button" class="btn-secondary" @click="confirmDeleteId = tpl.id ?? null">{{ t('delete') }}</button>
        </div>
        <div class="template-actions" v-else>
          <span>{{ t('templateDeleteConfirm') }}</span>
          <button type="button" class="btn-primary" @click="onDelete(tpl.id!)">{{ t('confirm') }}</button>
          <button type="button" class="btn-secondary" @click="confirmDeleteId = null">{{ t('cancel') }}</button>
        </div>
      </li>
    </ul>

    <button v-if="!editing" type="button" class="btn-secondary" @click="startAdd">{{ t('templateAdd') }}</button>

    <form v-else class="template-form" @submit.prevent="onSave" novalidate>
      <div class="form-group">
        <label for="tplName">{{ t('templateName') }} <span class="required">*</span></label>
        <input id="tplName" type="text" v-model="form.name" />
        <small v-if="errors.name" class="error">{{ t('templateErrorRequired') }}</small>
      </div>
      <div class="form-group">
        <label for="tplTee">{{ t('templateTee') }}</label>
        <input id="tplTee" type="text" v-model="form.tee" :placeholder="t('templateTeePlaceholder')" />
      </div>
      <div class="form-group">
        <label for="tplHoles">{{ t('holesPlayed') }} <span class="required">*</span></label>
        <select id="tplHoles" v-model.number="form.holes">
          <option :value="18">18 {{ t('holes') }}</option>
          <option :value="9">9 {{ t('holes') }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="tplCr">{{ t('courseRating') }} <span class="required">*</span></label>
        <input id="tplCr" type="number" step="0.1" v-model.number="form.courseRating" />
        <small v-if="errors.courseRating" class="error">{{ t('errorCourseRating') }}</small>
      </div>
      <div class="form-group">
        <label for="tplSlope">{{ t('slope') }} <span class="required">*</span></label>
        <input id="tplSlope" type="number" v-model.number="form.slope" />
        <small v-if="errors.slope" class="error">{{ t('errorSlope') }}</small>
      </div>
      <div class="form-group">
        <label for="tplPar">{{ t('templatePar') }}</label>
        <input id="tplPar" type="number" v-model.number="form.par" />
        <small v-if="errors.par" class="error">{{ t('templateErrorRequired') }}</small>
      </div>
      <div class="template-actions">
        <button type="submit" class="btn-primary">{{ t('templateSave') }}</button>
        <button type="button" class="btn-secondary" @click="cancel">{{ t('cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CourseTemplate } from '../db'
import { useCourseTemplates } from '../composables/useCourseTemplates'
import {
  emptyTemplateForm,
  templateLabel,
  toForm,
  toTemplate,
  validateTemplate,
  type TemplateErrors,
  type TemplateForm
} from '../utils/courseTemplate'

const { t } = useI18n()
const { templates, load, add, update, remove } = useCourseTemplates()

const editing = ref(false)
const editId = ref<number | null>(null)
const form = ref<TemplateForm>(emptyTemplateForm())
const errors = ref<TemplateErrors>({})
const confirmDeleteId = ref<number | null>(null)

onMounted(load)

function startAdd() {
  form.value = emptyTemplateForm()
  editId.value = null
  errors.value = {}
  editing.value = true
}

function startEdit(tpl: CourseTemplate) {
  form.value = toForm(tpl)
  editId.value = tpl.id ?? null
  errors.value = {}
  editing.value = true
}

function cancel() {
  editing.value = false
}

async function onSave() {
  errors.value = validateTemplate(form.value)
  if (Object.keys(errors.value).length) return
  const tpl = toTemplate(form.value)
  if (editId.value === null) await add(tpl)
  else await update(editId.value, tpl)
  editing.value = false
}

async function onDelete(id: number) {
  await remove(id)
  confirmDeleteId.value = null
}
</script>

<style scoped>
.template-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.template-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
}

.template-info {
  display: flex;
  flex-direction: column;
}

.template-values,
.templates-empty {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.template-form {
  margin-top: 1rem;
}
</style>
