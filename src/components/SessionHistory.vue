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
      <li v-for="s in items" :key="s.id" class="row" style="align-items:center; justify-content:space-between; padding:6px 0; border-top:1px solid var(--border);">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <strong style="line-height:1;">{{ s.result.value }} {{ s.result.unit }}</strong>
          <small style="color:var(--muted);">{{ formatDate(s.date) }}</small>
        </div>
        <div class="chips" style="justify-content:flex-end;">
          <span v-if="s.attempts != null" class="chip" title="Versuche">↻ {{ s.attempts }}</span>
          <span v-if="s.timerUsed != null" class="chip" title="Zeit">⏱️ {{ formatSeconds(s.timerUsed) }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessions'

const props = defineProps<{ drillId: string }>()

const sessions = useSessionsStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})

const loaded = computed(() => sessions.loaded)
const items = computed(() => sessions.listByDrill(props.drillId))

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
