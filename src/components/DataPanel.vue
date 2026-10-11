<template>
  <section class="card dp" aria-labelledby="dp-title" data-testid="data-panel">
    <h3 id="dp-title" class="dp-title">Daten &amp; Backup</h3>
    <p class="dp-note" data-testid="local-note">
      <AppIcon name="flag" /> Deine Daten liegen <strong>nur auf diesem Gerät</strong>. Sichere sie regelmäßig als Datei, damit sie bei einem Gerätewechsel oder Neuinstallation nicht verloren gehen.
    </p>

    <p class="dp-summary" data-testid="data-summary">
      <template v-if="current">Gespeichert: {{ describeSummary(summary) }}</template>
      <template v-else>Lädt…</template>
    </p>
    <p class="muted dp-last" data-testid="last-backup">
      <template v-if="settings.lastBackupAt">Letztes Backup: {{ formatBackupDate(settings.lastBackupAt) }} ({{ relativeDays(settings.lastBackupAt) }})</template>
      <template v-else>Noch kein Backup gespeichert.</template>
    </p>

    <div class="dp-actions">
      <button type="button" class="btn btn-primary" :disabled="busy" data-testid="export-backup" @click="doExport">Backup exportieren</button>
      <label class="btn dp-file" :class="{ disabled: busy }">
        <input ref="file" type="file" class="hidden" accept=".json,application/json" data-testid="import-file" :disabled="busy" @change="onFile" />
        Backup einspielen…
      </label>
      <button type="button" class="btn" data-testid="replay-onboarding" @click="emit('replay-onboarding')">Einführung wiederholen</button>
    </div>

    <p v-if="error" class="dp-error" role="alert" data-testid="import-error">{{ error }}</p>

    <div class="dp-danger" data-testid="danger-zone">
      <div class="dp-danger-text">
        <strong class="dp-danger-title">Alles löschen</strong>
        <span class="dp-danger-sub">Sessions, Runden, Sammlungen, Favoriten und Einstellungen von diesem Gerät entfernen.</span>
      </div>
      <button type="button" class="btn btn-danger" :disabled="busy" data-testid="reset-all" @click="resetAll">Alles löschen…</button>
    </div>

    <ImportDialog v-if="importing && current" :result="importing" :current="current" :busy="busy" @close="importing = null" @import="doImport" />
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import ImportDialog from '@/components/ImportDialog.vue'
import { formatBackupDate, relativeDays } from '@/backup/dates'
import { exportBackupFile } from '@/backup/download'
import { isParseFailure, parseBackup, type BackupData, type ParseSuccess } from '@/backup/format'
import { applyData, clearAllData, collectData, type ImportMode } from '@/backup/io'
import { describeAdded } from '@/backup/merge'
import { describeSummary, isEmptyData, summarize } from '@/backup/summary'
import { useSettingsStore } from '@/stores/settings'
import { requestConfirm } from '@/utils/confirmService'
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits<{ (e: 'replay-onboarding'): void; (e: 'changed'): void }>()

const settings = useSettingsStore()
const current = ref<BackupData | null>(null)
const summary = computed(() => summarize(current.value ?? { settings: null, favorites: [], sessions: [], hcpHistory: [], collections: [], focus: [], achievements: [], rounds: [], courseTemplates: [] }))
const importing = ref<ParseSuccess | null>(null)
const error = ref('')
const busy = ref(false)
const file = ref<HTMLInputElement | null>(null)

function toast(type: 'success' | 'info' | 'error', message: string) {
  globalThis.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }))
}

async function refresh() {
  if (!settings.loaded) await settings.load()
  current.value = await collectData()
}

onMounted(refresh)

async function doExport() {
  busy.value = true
  try {
    await exportBackupFile()
    await refresh()
  } finally {
    busy.value = false
  }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  input.value = '' // allows choosing the same file again
  if (!f) return
  error.value = ''
  let text = ''
  try {
    text = await f.text()
  } catch {
    error.value = 'Die Datei konnte nicht gelesen werden.'
    return
  }
  const parsed = parseBackup(text)
  if (isParseFailure(parsed)) {
    error.value = parsed.message
    return
  }
  await refresh()
  importing.value = parsed
}

async function doImport(mode: ImportMode, opts: { backupFirst: boolean }) {
  const parsed = importing.value
  if (!parsed || !current.value) return
  if (mode === 'replace') {
    const ok = await requestConfirm('Alle Daten auf diesem Gerät durch die Sicherung ersetzen?', {
      title: 'Daten ersetzen', danger: true, confirmLabel: 'Ersetzen',
      details: isEmptyData(summarize(current.value)) ? [] : [`Das geht verloren: ${describeSummary(summarize(current.value))}`],
    })
    if (!ok) return
  }
  busy.value = true
  try {
    if (opts.backupFirst && !(await exportBackupFile()).ok) return // no backup, no replacing
    const out = await applyData(mode, parsed.backup.data)
    importing.value = null
    toast('success', mode === 'merge' && out.added ? `Backup eingespielt. ${describeAdded(out.added)}` : 'Backup eingespielt. Alle Daten wurden ersetzt.')
    await refresh()
    emit('changed')
  } catch (e) {
    console.error('Import failed', e)
    error.value = 'Das Einspielen ist fehlgeschlagen. Deine bisherigen Daten wurden nicht verändert, soweit möglich - bitte versuche es erneut.'
    importing.value = null
  } finally {
    busy.value = false
  }
}

async function resetAll() {
  if (!current.value) await refresh()
  const s = summary.value
  const ok = await requestConfirm('Wirklich alles von diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.', {
    title: 'Alles löschen?',
    danger: true,
    confirmLabel: 'Alles löschen',
    phrase: 'LÖSCHEN',
    details: isEmptyData(s) ? [] : [describeSummary(s)],
    secondary: { label: 'Zuerst Backup exportieren', doneLabel: 'Backup gespeichert', run: async () => (await exportBackupFile()).ok },
  })
  if (!ok) return
  busy.value = true
  try {
    await clearAllData()
    toast('info', 'Alle Daten wurden gelöscht.')
    await refresh()
    emit('changed')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.dp {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.dp-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.dp-note,
.dp-summary,
.dp-last {
  margin: 0;
}

.dp-summary {
  font-weight: 700;
}

.dp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.dp-file {
  cursor: pointer;
  text-align: center;
}

.dp-file.disabled {
  opacity: 0.6;
  cursor: default;
}

.dp-error {
  margin: 0;
  color: var(--danger-ink);
  font-weight: 600;
}

.dp-danger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding: var(--space-3);
  background: color-mix(in oklab, var(--danger) 8%, var(--surface));
  border: 1px solid color-mix(in oklab, var(--danger) 35%, var(--border));
  border-radius: var(--radius-lg);
}

.dp-danger-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dp-danger-title,
.dp-danger-sub {
  color: var(--danger-ink);
}

.dp-danger-sub {
  font-size: var(--font-size-sm);
}
</style>
