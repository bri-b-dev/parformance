<template>
  <section class="card history-card mt-card">
    <header class="section-head">
      <h3 class="section-title">Verlauf</h3>
      <small v-if="items.length" class="chip" aria-label="Anzahl Sessions">{{ items.length }} Einträge</small>
    </header>

    <!-- Empty state -->
    <output v-if="loaded && items.length === 0" class="p-4 text-sm muted" aria-live="polite">
      Noch keine Einträge. Starte eine Session und speichere dein Ergebnis.
    </output>

    <!-- List -->
    <ul v-else class="history-list">
      <li v-for="s in items" :key="s.id" class="card history-item">
        <div class="row row-between">
          <div class="hist-value">
            <strong class="hist-number">{{ s.result.value }} {{ s.result.unit }}</strong>
            <small class="muted">{{ formatDate(s.date) }}</small>
          </div>
          <div class="chips hist-chips">
            <span v-if="s.attempts != null" class="chip" title="Versuche">↻ {{ s.attempts }}</span>
            <span v-if="s.timerUsed != null" class="chip" title="Zeit"><AppIcon name="timer" /> {{ formatSeconds(s.timerUsed) }}</span>
          </div>
        </div>

        <!-- Notes display / inline edit -->
        <div class="mt-note">
          <template v-if="editingId === s.id">
            <label class="label" :for="`notes-${s.id}`">Notizen bearbeiten</label>
            <textarea :id="`notes-${s.id}`" v-model.trim="draftNotes" class="input" rows="2"
              data-testid="notes-textarea" aria-live="polite"></textarea>
            <div class="row row-end">
              <button type="button" class="btn" data-testid="notes-cancel" @click="cancelEdit">Abbrechen</button>
              <button type="button" class="btn btn-primary" data-testid="notes-save"
                @click="saveNotes(s.id)">Speichern</button>
            </div>
          </template>
          <template v-else>
            <p v-if="s.notes" class="flush pre-wrap">{{ s.notes }}</p>
            <p v-else class="flush muted">Keine Notizen</p>
            <div class="row row-end">
              <button type="button" class="btn" :aria-label="`Notizen bearbeiten für ${formatDate(s.date)}`"
                data-testid="notes-edit" @click="startEdit(s)">Notizen</button>
              <template v-if="!isAwarded(s)">
                <button type="button" class="btn" data-testid="award-badge" @click="awardBadge(s)">Badge
                  vergeben</button>
              </template>
              <button v-else type="button" class="chip" title="Auszeichnung entfernen" aria-label="Auszeichnung entfernen"
                @click="removeAward(s)"><AppIcon name="award" /></button>
            </div>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';
import { useSessionsStore } from '@/stores/sessions';
import { useAchievementsStore } from '@/stores/achievements'
import type { Session } from '@/types';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{ drillId: string }>()

const sessions = useSessionsStore()
const achievements = useAchievementsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
  if (!achievements.loaded) await achievements.load()
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

function isAwarded(s: Session) {
  return achievements.items.some(i => i.sessionId === s.id)
}

async function awardBadge(s: Session) {
  try {
    // create a stable id for the snapshot
    const id = `badge_${s.id}_${Date.now()}`
    const snap = await achievements.awardBadgeFromSession({
      id,
      sessionId: s.id,
      criteriaVersion: 'v1',
      title: `Badge für ${formatDate(s.date)}`,
      description: `Manuell vergeben für Session ${s.id}`,
    })
    // fire a success toast
    try {
      // @ts-ignore
      globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Auszeichnung vergeben' } }))
    } catch {
      // fallback: console
      // eslint-disable-next-line no-console
      console.log('Awarded snapshot', snap)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to award badge', e)
    try {
      // @ts-ignore
      globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Fehler beim Vergeben der Auszeichnung' } }))
    } catch {
      // fallback: log instead of blocking alert
      // eslint-disable-next-line no-console
      console.log('Fehler beim Vergeben der Auszeichnung')
    }
  }
}

async function removeAward(s: Session) {
  try {
    const item = achievements.items.find(i => i.sessionId === s.id)
    if (!item) return
    // ask via global confirm modal (falls available)
    const confirmed = await showConfirm('Auszeichnung für diese Session entfernen?')
    if (!confirmed) return
    await achievements.remove(item.id)
    try {
      // @ts-ignore
      globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Auszeichnung entfernt' } }))
    } catch { /* noop */ }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to remove award', e)
    try {
      // @ts-ignore
      globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Fehler beim Entfernen der Auszeichnung' } }))
    } catch {
      // fallback: log instead of blocking alert
      // eslint-disable-next-line no-console
      console.log('Fehler beim Entfernen der Auszeichnung')
    }
  }
}

import { requestConfirm } from '@/utils/confirmService'

function showConfirm(message: string): Promise<boolean> {
  return requestConfirm(message)
}
</script>

<style scoped>
.hist-value {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hist-number {
  line-height: 1;
}

.hist-chips {
  justify-content: flex-end;
}

.mt-note {
  margin-top: 6px;
}

.history-card {
  width: 100%;
  box-sizing: border-box;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.history-item {
  width: 100%;
  max-width: 100%;
  margin: 6px 0;
  box-sizing: border-box;
}

.history-item .row {
  flex-wrap: wrap;
  gap: 8px;
}

.history-item .chip {
  max-width: 100%;
}
</style>
