<template>
  <div class="card focus-card" data-testid="focus-card">
    <h2 class="focus-h">Fokus</h2>

    <form v-if="editing" class="focus-form" data-testid="focus-form" @submit.prevent="save">
      <label class="label" for="focus-label">Woran willst du arbeiten?</label>
      <input id="focus-label" v-model="form.label" class="input" type="text" maxlength="60" placeholder="z. B. Tempo oder Lag-Putting 10-15 m" data-testid="focus-label" />
      <div class="focus-suggest" role="group" aria-label="Vorschläge">
        <button v-for="s in SUGGESTIONS" :key="s" type="button" class="chip focus-suggest-chip" @click="form.label = s">{{ s }}</button>
      </div>

      <label class="label" for="focus-collection">Sammlung (optional)</label>
      <select id="focus-collection" v-model="form.collectionId" class="input" data-testid="focus-collection">
        <option value="">Keine</option>
        <option v-for="c in collections.items" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <label class="label" for="focus-to">Bis (optional)</label>
      <input id="focus-to" v-model="form.to" class="input" type="date" :min="today" data-testid="focus-to" />

      <div class="focus-actions">
        <button type="button" class="btn" @click="editing = false">Abbrechen</button>
        <button type="submit" class="btn btn-primary" :disabled="!form.label.trim()" data-testid="focus-save">Speichern</button>
      </div>
    </form>

    <template v-else-if="focus.active">
      <p class="focus-line">
        <span class="chip" data-testid="focus-active">{{ focus.active.label }}</span>
        <span class="muted"> seit {{ formatDate(focus.active.from) }}<template v-if="remaining !== null"> - {{ remainingText }}</template></span>
      </p>
      <p class="muted" data-testid="focus-count">{{ countSessions }} {{ countSessions === 1 ? 'Session' : 'Sessions' }} mit diesem Fokus</p>
      <p v-if="linked" class="muted">Sammlung: {{ linked.name }}</p>
      <div class="focus-actions">
        <button v-if="linked" type="button" class="btn btn-primary" data-testid="focus-start" @click="startLinked">Sammlung starten</button>
        <button type="button" class="btn" data-testid="focus-edit" @click="openEdit">Bearbeiten</button>
        <button type="button" class="btn" data-testid="focus-end" @click="endFocus">Beenden</button>
      </div>
    </template>

    <template v-else>
      <p class="muted">Kein Fokus gesetzt. Ein Fokus erscheint bei deinen Drills und im Verlauf und beeinflusst die Vorschläge.</p>
      <div class="focus-actions">
        <button type="button" class="btn btn-primary" data-testid="focus-new" @click="openNew">Fokus setzen</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useStartRun } from '@/composables/useStartRun'
import { dayKey, daysUntilEnd } from '@/focus/active'
import { useCollectionsStore } from '@/stores/collections'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFocusStore } from '@/stores/focus'
import { useSessionsStore } from '@/stores/sessions'
import { requestConfirm } from '@/utils/confirmService'
import { computed, onMounted, reactive, ref } from 'vue'

const SUGGESTIONS = ['Tempo', 'Lag-Putting', 'Kurzes Spiel', 'Wedge-Distanzen', 'Bunker-Sicherheit', 'Mentale Stärke']

const focus = useFocusStore()
const collections = useCollectionsStore()
const sessions = useSessionsStore()
const catalog = useDrillCatalogStore()
const startRun = useStartRun()

onMounted(async () => {
  await Promise.all([
    focus.loaded ? null : focus.load(),
    collections.loaded ? null : collections.load(),
    sessions.loaded ? null : sessions.load(),
    catalog.loaded ? null : catalog.load(),
  ])
})

const today = dayKey(new Date())
const editing = ref(false)
const form = reactive({ label: '', collectionId: '', to: '' })

const countSessions = computed(() => (focus.active ? sessions.sessions.filter(s => s.focusId === focus.active!.id).length : 0))
const linked = computed(() => (focus.active?.collectionId ? collections.byId(focus.active.collectionId) : undefined))
const remaining = computed(() => (focus.active ? daysUntilEnd(focus.active) : null))
const remainingText = computed(() => {
  const d = remaining.value
  if (d === null) return ''
  if (d === 0) return 'endet heute'
  return `noch ${d} ${d === 1 ? 'Tag' : 'Tage'}`
})

const formatDate = (key: string) => key.split('-').reverse().slice(0, 2).join('.') + '.'

function openNew() {
  Object.assign(form, { label: '', collectionId: '', to: '' })
  editing.value = true
}

function openEdit() {
  const f = focus.active
  if (!f) return
  Object.assign(form, { label: f.label, collectionId: f.collectionId ?? '', to: f.to ?? '' })
  editing.value = true
}

function save() {
  const data = { label: form.label, collectionId: form.collectionId || undefined, to: form.to || undefined }
  if (focus.active) focus.update(focus.active.id, data)
  else focus.start(data)
  editing.value = false
}

async function endFocus() {
  if (focus.active && (await requestConfirm(`Fokus „${focus.active.label}" beenden?`))) focus.end(focus.active.id)
}

function startLinked() {
  const c = linked.value
  if (!c) return
  const ids = c.drillIds.filter(id => catalog.drills.some(d => d.id === id))
  return startRun({ title: c.name, drillIds: ids, collectionId: c.id })
}
</script>

<style scoped>
.focus-card,
.focus-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.focus-card {
  padding: 14px 16px;
}

.focus-h {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.focus-line {
  margin: 0;
}

.focus-actions,
.focus-suggest {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.focus-suggest-chip {
  cursor: pointer;
}
</style>
