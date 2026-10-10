<template>
  <section class="container" aria-labelledby="coll-title">
    <h1 id="coll-title" class="text-xl font-semibold">Drills</h1>
    <DrillsTabs />

    <output v-if="!ready" class="p-4 flex items-center" aria-live="polite" :style="{ color: 'var(--muted)' }">Lädt…</output>

    <template v-else>
      <!-- Editor -->
      <form v-if="editing" class="card coll-card" data-testid="collection-editor" @submit.prevent="save">
        <h2 class="coll-h">{{ editing === 'new' ? 'Neue Sammlung' : 'Sammlung bearbeiten' }}</h2>

        <label class="label" for="coll-name">Name</label>
        <input id="coll-name" v-model="form.name" class="input" type="text" maxlength="60" placeholder="z. B. Vor der Runde 20 min" data-testid="collection-name" />

        <fieldset class="coll-icons">
          <legend class="label">Symbol (optional)</legend>
          <button v-for="i in ICONS" :key="i" type="button" class="coll-icon" :class="{ active: form.icon === i }" :aria-pressed="form.icon === i"
            :aria-label="`Symbol ${i}`" @click="form.icon = form.icon === i ? '' : i">{{ i }}</button>
        </fieldset>

        <div v-if="selected.length" data-testid="collection-selected">
          <h3 class="label">Reihenfolge ({{ selected.length }} Drills, {{ selectedMinutes }} Min.)</h3>
          <ol class="coll-order">
            <li v-for="(d, i) in selected" :key="d.id" class="coll-order-item">
              <span class="coll-order-title">{{ d.title }}</span>
              <span class="coll-order-actions">
                <button type="button" class="btn" :disabled="i === 0" :aria-label="`${d.title} nach oben`" data-testid="move-up" @click="move(i, -1)">↑</button>
                <button type="button" class="btn" :disabled="i === selected.length - 1" :aria-label="`${d.title} nach unten`" data-testid="move-down" @click="move(i, 1)">↓</button>
                <button type="button" class="btn" :aria-label="`${d.title} entfernen`" data-testid="remove-drill" @click="toggle(d.id)">✕</button>
              </span>
            </li>
          </ol>
        </div>

        <h3 class="label">Drills auswählen</h3>
        <div class="coll-filter">
          <label class="sr-only" for="coll-search">Suche</label>
          <input id="coll-search" v-model.trim="query" class="input" type="search" placeholder="Drill suchen…" />
          <label class="sr-only" for="coll-cat">Kategorie</label>
          <select id="coll-cat" v-model="category" class="input">
            <option value="">Alle Kategorien</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <ul class="coll-pick" data-testid="collection-picker">
          <li v-for="d in pickable" :key="d.id">
            <label class="coll-pick-item">
              <input type="checkbox" :checked="form.drillIds.includes(d.id)" :data-testid="`pick-${d.id}`" @change="toggle(d.id)" />
              <span class="coll-pick-title">{{ d.title }}</span>
              <span class="chip">{{ d.category }}</span>
              <span class="muted">{{ drillMinutes(d) }} Min.</span>
            </label>
          </li>
          <li v-if="pickable.length === 0" class="muted">Keine Drills gefunden.</li>
        </ul>

        <div class="coll-actions">
          <button type="button" class="btn" @click="cancel">Abbrechen</button>
          <button type="submit" class="btn btn-primary" :disabled="!canSave" data-testid="collection-save">Speichern</button>
        </div>
      </form>

      <button v-else type="button" class="btn btn-primary coll-new" data-testid="collection-new" @click="openNew">Neue Sammlung</button>

      <!-- List -->
      <ul v-if="collections.items.length" class="coll-list">
        <li v-for="c in collections.items" :key="c.id" class="card coll-card" data-testid="collection-item">
          <div class="coll-head">
            <h2 class="coll-h"><span v-if="c.icon" aria-hidden="true">{{ c.icon }} </span>{{ c.name }}</h2>
            <span class="chip">{{ known(c).length }} Drills - {{ minutesOf(c) }} Min.</span>
          </div>
          <p v-if="known(c).length < c.drillIds.length" class="muted">{{ c.drillIds.length - known(c).length }} Drill(s) gibt es nicht mehr im Katalog.</p>
          <p class="muted coll-preview">{{ known(c).map(d => d.title).join(' - ') }}</p>
          <div class="coll-actions">
            <button type="button" class="btn btn-primary" :disabled="known(c).length === 0" data-testid="collection-start" @click="start(c)">Starten</button>
            <button type="button" class="btn" data-testid="collection-edit" @click="openEdit(c)">Bearbeiten</button>
            <button type="button" class="btn" :aria-label="`${c.name} löschen`" data-testid="collection-delete" @click="remove(c)">Löschen</button>
          </div>
        </li>
      </ul>
      <div v-else-if="!editing" class="card coll-card" data-testid="collection-empty">
        <h2 class="coll-h">Noch keine Sammlungen</h2>
        <p class="muted">Stelle Drills zu einer Einheit zusammen, z. B. „Vor der Runde 20 min", und arbeite sie nacheinander ab.</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import DrillsTabs from '@/components/DrillsTabs.vue'
import { useStartRun } from '@/composables/useStartRun'
import { COLLECTION_ICONS, useCollectionsStore, type Collection } from '@/stores/collections'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { drillMinutes } from '@/today/suggest'
import { requestConfirm } from '@/utils/confirmService'
import { computed, onMounted, reactive, ref } from 'vue'

const ICONS = COLLECTION_ICONS
const catalog = useDrillCatalogStore()
const collections = useCollectionsStore()
const startRun = useStartRun()

onMounted(async () => {
  await Promise.all([catalog.loaded ? null : catalog.load(), collections.loaded ? null : collections.load()])
})
const ready = computed(() => catalog.loaded && collections.loaded)

const editing = ref<'new' | string | null>(null)
const form = reactive({ name: '', icon: '', drillIds: [] as string[] })
const query = ref('')
const category = ref('')

const categories = computed(() => Array.from(new Set(catalog.drills.map(d => d.category))).sort((a, b) => a.localeCompare(b, 'de')))
const byId = computed(() => new Map(catalog.drills.map(d => [d.id, d])))
const selected = computed(() => form.drillIds.map(id => byId.value.get(id)).filter((d): d is NonNullable<typeof d> => !!d))
const selectedMinutes = computed(() => selected.value.reduce((n, d) => n + drillMinutes(d), 0))
const pickable = computed(() => {
  const q = query.value.toLowerCase()
  return catalog.drills.filter(d => (!category.value || d.category === category.value) && (!q || d.title.toLowerCase().includes(q)))
})
const canSave = computed(() => form.name.trim().length > 0 && form.drillIds.length > 0)

const known = (c: Collection) => c.drillIds.map(id => byId.value.get(id)).filter((d): d is NonNullable<typeof d> => !!d)
const minutesOf = (c: Collection) => known(c).reduce((n, d) => n + drillMinutes(d), 0)

function openNew() {
  Object.assign(form, { name: '', icon: '', drillIds: [] })
  query.value = ''
  category.value = ''
  editing.value = 'new'
}

function openEdit(c: Collection) {
  Object.assign(form, { name: c.name, icon: c.icon ?? '', drillIds: [...c.drillIds] })
  query.value = ''
  category.value = ''
  editing.value = c.id
}

function cancel() { editing.value = null }

function toggle(id: string) {
  const i = form.drillIds.indexOf(id)
  if (i >= 0) form.drillIds.splice(i, 1)
  else form.drillIds.push(id)
}

function move(i: number, delta: number) {
  const j = i + delta
  if (j < 0 || j >= form.drillIds.length) return
  const ids = form.drillIds
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
}

function save() {
  if (!canSave.value) return
  const data = { name: form.name, drillIds: [...form.drillIds], icon: form.icon || undefined }
  if (editing.value === 'new') collections.add(data)
  else if (editing.value) collections.update(editing.value, data)
  editing.value = null
}

async function remove(c: Collection) {
  if (await requestConfirm(`Sammlung „${c.name}" löschen?`)) collections.remove(c.id)
}

function start(c: Collection) {
  return startRun({ title: c.name, drillIds: known(c).map(d => d.id), collectionId: c.id })
}
</script>

<style scoped>
.coll-new {
  margin-bottom: 10px;
}

.coll-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.coll-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.coll-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.coll-h {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.coll-preview {
  margin: 0;
  font-size: 0.9rem;
}

.coll-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.coll-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border: 0;
  padding: 0;
  margin: 0;
}

.coll-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 1.2rem;
  cursor: pointer;
}

.coll-icon.active {
  border-color: var(--primary);
  background: color-mix(in oklab, var(--primary) 12%, var(--surface));
}

.coll-order {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.coll-order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.coll-order-title {
  min-width: 0;
}

.coll-order-actions {
  display: flex;
  gap: 4px;
  flex: none;
}

.coll-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.coll-pick {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.coll-pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  min-height: 44px;
  border-bottom: 1px solid var(--border);
}

.coll-pick-title {
  flex: 1;
  min-width: 0;
}
</style>
