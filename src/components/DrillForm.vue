<template>
  <form class="card" @submit.prevent="save" aria-labelledby="drill-form-title">
    <h2 id="drill-form-title" class="sr-only">Drill anlegen oder bearbeiten</h2>
    <div class="field">
      <label class="label" for="title">Titel</label>
      <input id="title" name="title" class="input" v-model="model.title" required />
    </div>

    <div class="row">
      <div class="field" style="min-width:180px; flex:1">
        <label class="label" for="category">Kategorie</label>
        <select id="category" name="category" class="input" v-model="model.category" required>
          <option value="chipping">Chipping</option>
          <option value="putting">Putting</option>
          <option value="driving">Driving</option>
          <option value="irons">Irons</option>
          <option value="bunker">Bunker</option>
        </select>
      </div>

      <div class="field" style="min-width:160px">
        <label class="label" for="difficulty">Schwierigkeit (1–5)</label>
        <input id="difficulty" name="difficulty" class="input" type="number" min="1" max="5" v-model.number="model.difficulty" />
      </div>

      <div class="field" style="min-width:160px">
        <label class="label" for="durationMin">Dauer (Min)</label>
        <input id="durationMin" name="durationMin" class="input" type="number" min="1" v-model.number="model.durationMin" />
      </div>
    </div>

    <div class="field">
      <label class="label" for="description">Beschreibung</label>
      <textarea id="description" name="description" class="input" v-model="model.description" rows="4"></textarea>
    </div>

    <div class="field">
      <label class="label" for="tags">Tags (Komma-getrennt)</label>
      <input id="tags" name="tags" class="input" v-model="tagsInput" placeholder="kurzspiel, draußen" aria-describedby="tags-help" />
      <p id="tags-help" class="sr-only">Mehrere Tags mit Komma trennen.</p>
    </div>

    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
      <button class="btn" type="button" @click="$router.back()">Abbrechen</button>
      <button class="btn btn-primary" type="submit">Speichern</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import type { Drill, DrillCategory } from '@/types/drills'

const props = defineProps<{
  modelValue?: Drill | Partial<Drill>
}>()

const emit = defineEmits<{
  (e: 'save', value: Omit<Drill, 'id' | 'updatedAt'> | Drill): void
}>()

// Formularzustand
const model = reactive<Partial<Drill>>({
  title: '',
  category: 'chipping' as DrillCategory,
  difficulty: 3,
  durationMin: 10,
  description: '',
  tags: []
})

const tagsInput = ref('')

// ggf. vorhandenes Drill in das Formular spiegeln
watchEffect(() => {
  if (props.modelValue) Object.assign(model, props.modelValue)
  tagsInput.value = (model.tags ?? []).join(', ')
})

function save() {
  const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

  // Beim Speichern geben wir ein vollständiges Drill ohne id/updatedAt zurück
  emit('save', {
    title: model.title!,
    category: model.category!,
    difficulty: model.difficulty,
    durationMin: model.durationMin,
    description: model.description,
    tags
  } as Omit<Drill, 'id' | 'updatedAt'>)
}
</script>
