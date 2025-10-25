<template>
  <section class="card" style="margin-top:10px;">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
      <h3 style="margin:0; font-weight:700;">Verlauf</h3>
      <small class="chip" v-if="items.length" aria-label="Anzahl Sessions">{{ items.length }} Einträge</small>
    </header>

    <!-- Empty state -->
    <div v-if="loaded && items.length === 0" class="p-4 text-sm text-gray-600" role="status" aria-live="polite">
      Noch keine Einträge. Starte eine Session und speichere dein Ergebnis.
    </div>

    <!-- List -->
    <ul v-else class="list-none" style="padding:0; margin:0;">
      <li v-for="s in items" :key="s.id" class="card" style="margin:6px 0;">
        <div class="row" style="align-items:center; justify-content:space-between;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <strong style="line-height:1;">{{ s.result.value }} {{ s.result.unit }}</strong>
            <small style="color:var(--muted);">{{ formatDate(s.date) }}</small>
          </div>
          <div class="chips" style="justify-content:flex-end;">
            <span v-if="s.attempts != null" class="chip" title="Versuche">↻ {{ s.attempts }}</span>
            <span v-if="s.timerUsed != null" class="chip" title="Zeit">⏱️ {{ formatSeconds(s.timerUsed) }}</span>
          </div>
        </div>

        <!-- Notes display / inline edit -->
        <div style="margin-top:6px;">
          <template v-if="editingId === s.id">
            <label class="label" :for="`notes-${s.id}`">Notizen bearbeiten</label>
            <textarea
              :id="`notes-${s.id}`"
              class="input"
              rows="2"
              v-model.trim="draftNotes"
              data-testid="notes-textarea"
              aria-live="polite"
            ></textarea>
            <div class="row" style="justify-content:flex-end; margin-top:6px;">
              <button type="button" class="btn" @click="cancelEdit" data-testid="notes-cancel">Abbrechen</button>
              <button type="button" class="btn btn-primary" @click="saveNotes(s.id)" data-testid="notes-save">Speichern</button>
            </div>
          </template>
          <template v-else>
            <p v-if="s.notes" style="margin:0; white-space:pre-wrap;">{{ s.notes }}</p>
            <p v-else style="margin:0; color:var(--muted);">Keine Notizen</p>
            <div class="row" style="justify-content:flex-end; margin-top:6px;">
              <button type="button" class="btn" @click="startEdit(s)" :aria-label="`Notizen bearbeiten für ${formatDate(s.date)}`" data-testid="notes-edit">Notizen</button>
            </div>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Session } from '@/types'
import { useSessionsStore } from '@/stores/sessions'

const props = defineProps<{ drillId: string }>()

const sessions = useSessionsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})

const loaded = computed(() => sessions.loaded)
const items = computed(() => sessions.listByDrill(props.drillId))

// Inline notes editing state
const editingId = ref<string | null>(null)
const draftNotes = ref<string>('')

function startEdit(s: Session) {
  editingId.value = s.id
  draftNotes.value = s.notes ?? ''
}
function cancelEdit() {
  editingId.value = null
  draftNotes.value = ''
}
async function saveNotes(id: string) {
  await sessions.updateNotes(id, draftNotes.value || undefined)
  editingId.value = null
  draftNotes.value = ''
}

function pad(n: number) { return n.toString().padStart(2, '0') }
function formatSeconds(total: number) {
  const t = Math.max(0, Math.floor(total || 0))
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${pad(m)}:${pad(s)}`
}
function formatDate(iso: string) {
  // Keep deterministic/simple: YYYY-MM-DD HH:mm (local time)
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    return `${y}-${m}-${day} ${hh}:${mm}`
  } catch {
    return iso
  }
}
</script>
