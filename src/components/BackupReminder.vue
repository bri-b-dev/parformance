<template>
  <aside v-if="status.due" class="card br" role="note" aria-labelledby="br-title" data-testid="backup-reminder">
    <h2 id="br-title" class="br-title">Zeit für ein Backup</h2>
    <p class="br-text" data-testid="backup-reminder-text">{{ text }}</p>
    <div class="br-actions">
      <button type="button" class="btn btn-primary" :disabled="busy" data-testid="backup-now" @click="backupNow">Jetzt sichern</button>
      <button type="button" class="btn" data-testid="backup-later" @click="later">Später</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { exportBackupFile } from '@/backup/download'
import { formatBackupDate } from '@/backup/dates'
import { backupReminder, snoozeUntil } from '@/backup/reminder'
import { useRoundsStore } from '@/stores/rounds'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { computed, ref } from 'vue'

/**
 * Reminds about a backup because the data only lives on this device: for the first one as soon as there
 * is something worth keeping, then after 10 new sessions/rounds or after 30 days with changes.
 */
const settings = useSettingsStore()
const sessions = useSessionsStore()
const rounds = useRoundsStore()
const busy = ref(false)

const now = new Date()
const count = computed(() => sessions.sessions.length + rounds.total)
const status = computed(() => (settings.loaded && sessions.loaded
  ? backupReminder({ now, lastBackupAt: settings.lastBackupAt, lastBackupCount: settings.lastBackupCount, currentCount: count.value, snoozedUntil: settings.backupSnoozedUntil })
  : { due: false, reason: null, newItems: 0 }))

const text = computed(() => {
  const n = status.value.newItems
  const entries = `${n} ${n === 1 ? 'neuer Eintrag' : 'neue Einträge'}`
  if (status.value.reason === 'never') return `Deine ${n} Einträge (Sessions und Runden) liegen nur auf diesem Gerät. Sichere sie als Datei, damit nichts verloren geht.`
  if (status.value.reason === 'old' && settings.lastBackupAt) {
    const days = Math.floor((now.getTime() - Date.parse(settings.lastBackupAt)) / 86_400_000)
    return `Dein letztes Backup ist ${days} Tage alt (${formatBackupDate(settings.lastBackupAt)}), seitdem gibt es ${entries}.`
  }
  return `Seit deinem letzten Backup${settings.lastBackupAt ? ` (${formatBackupDate(settings.lastBackupAt)})` : ''} gibt es ${entries}. Deine Daten liegen nur auf diesem Gerät.`
})

async function backupNow() {
  busy.value = true
  try {
    await exportBackupFile()
  } finally {
    busy.value = false
  }
}

async function later() {
  await settings.update({ backupSnoozedUntil: snoozeUntil(new Date()) })
}
</script>

<style scoped>
.br {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
}

.br-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.br-text {
  margin: 0;
}

.br-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
