<template>
  <DialogShell variant="center" layer="modal" labelledby="imp-title" initial-focus='[data-testid="import-confirm"]' backdrop-testid="import-backdrop" class="imp" @close="emit('close')">
    <h2 id="imp-title" class="imp-title">Backup einspielen</h2>

    <section class="imp-file" aria-labelledby="imp-file-h">
      <h3 id="imp-file-h" class="imp-h">Das steht in der Datei</h3>
      <p class="imp-summary" data-testid="import-summary">{{ describeSummary(fileSummary) }}</p>
      <p class="muted imp-meta" data-testid="import-meta">
        Gesichert am {{ formatBackupDate(result.backup.exportedAt) }}<template v-if="result.backup.appVersion"> mit ParFormance {{ result.backup.appVersion }}</template>.
        <template v-if="result.legacy"> Ältere Sicherung ohne Runden und Kursvorlagen.</template>
      </p>
      <ul v-if="result.warnings.length" class="imp-warn" role="status" data-testid="import-warnings">
        <li v-for="w in result.warnings" :key="w">{{ w }}</li>
      </ul>
    </section>

    <p v-if="fileEmpty" class="imp-empty" role="alert" data-testid="import-empty">Diese Sicherung enthält keine Daten.</p>

    <fieldset v-else class="imp-modes">
      <legend class="imp-h">Wie soll sie eingespielt werden?</legend>
      <label class="imp-mode" :class="{ on: mode === 'merge' }">
        <input v-model="mode" type="radio" name="import-mode" value="merge" data-testid="mode-merge" />
        <span>
          <strong>Zusammenführen (empfohlen)</strong>
          <small class="muted">Deine Daten auf diesem Gerät bleiben, neue kommen dazu.</small>
          <small class="imp-added" data-testid="import-added">{{ describeAdded(merge.added) }}</small>
        </span>
      </label>
      <label class="imp-mode" :class="{ on: mode === 'replace' }">
        <input v-model="mode" type="radio" name="import-mode" value="replace" data-testid="mode-replace" />
        <span>
          <strong>Ersetzen</strong>
          <small class="muted">Alles auf diesem Gerät wird durch die Sicherung ersetzt.</small>
          <small v-if="!currentEmpty" class="imp-lose" data-testid="import-lose">Das geht verloren: {{ describeSummary(currentSummary) }}.</small>
        </span>
      </label>
      <label v-if="mode === 'replace' && !currentEmpty" class="imp-first">
        <input v-model="backupFirst" type="checkbox" data-testid="import-backup-first" />
        <span>Vorher ein Backup der aktuellen Daten speichern</span>
      </label>
    </fieldset>

    <div class="imp-actions">
      <button type="button" class="btn" data-testid="import-cancel" @click="emit('close')">Abbrechen</button>
      <button type="button" class="btn" :class="mode === 'replace' ? 'btn-danger' : 'btn-primary'" :disabled="fileEmpty || busy" data-testid="import-confirm"
        @click="emit('import', mode, { backupFirst: mode === 'replace' && backupFirst })">{{ mode === 'replace' ? 'Ersetzen' : 'Zusammenführen' }}</button>
    </div>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import type { BackupData, ParseResult } from '@/backup/format'
import type { ImportMode } from '@/backup/io'
import { describeAdded, mergeData } from '@/backup/merge'
import { describeSummary, isEmptyData, summarize } from '@/backup/summary'
import { formatBackupDate } from '@/backup/dates'
import { computed, ref } from 'vue'

type Ok = Extract<ParseResult, { ok: true }>
const props = defineProps<{ result: Ok; current: BackupData; busy?: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', mode: ImportMode, opts: { backupFirst: boolean }): void
}>()

const mode = ref<ImportMode>('merge')
const backupFirst = ref(true)

const fileSummary = computed(() => summarize(props.result.backup.data))
const currentSummary = computed(() => summarize(props.current))
const fileEmpty = computed(() => isEmptyData(fileSummary.value))
const currentEmpty = computed(() => isEmptyData(currentSummary.value))
const merge = computed(() => mergeData(props.current, props.result.backup.data))
</script>

<style scoped>
.imp {
  --dlg-width: 480px;
}

.imp-title {
  margin: 0 0 var(--space-3);
  font-size: 1.2rem;
  font-weight: 800;
}

.imp-h {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--muted);
  font-weight: 700;
}

.imp-summary {
  margin: 0;
  font-weight: 700;
}

.imp-meta,
.imp-warn {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
}

.imp-warn {
  padding-left: 1.2rem;
}

.imp-empty {
  color: var(--danger-ink);
  font-weight: 600;
}

.imp-modes {
  border: 0;
  padding: 0;
  margin: var(--space-3) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.imp-mode {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.imp-mode.on {
  border-color: var(--focus);
  background: color-mix(in oklab, var(--primary) 8%, transparent);
}

.imp-mode input {
  margin-top: 4px;
  width: 20px;
  height: 20px;
  flex: none;
}

.imp-mode span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.imp-lose {
  color: var(--danger-ink);
}

.imp-first {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.imp-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
