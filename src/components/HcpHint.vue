<template>
  <aside v-if="settings.loaded && settings.onboardingDone && currentHcp == null && !settings.hcpHintDismissed" class="hcp-hint card" role="note" data-testid="hcp-hint">
    <span>Ohne Handicap können wir keine Zielwerte anzeigen. Trage es ein oder erfasse Runden im Handicap-Bereich.</span>
    <span class="hcp-hint-actions">
      <button type="button" class="btn btn-primary" data-testid="hcp-hint-enter" @click="ui.setSettings(true)">Handicap eintragen</button>
      <button type="button" class="btn" data-testid="hcp-hint-dismiss" aria-label="Hinweis schließen" @click="settings.update({ hcpHintDismissed: true })">Später</button>
    </span>
  </aside>
</template>

<script setup lang="ts">
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'

const settings = useSettingsStore()
const { hcp: currentHcp } = useCurrentHcp()
const ui = useUiStore()
</script>

<style scoped>
.hcp-hint-actions {
  display: flex;
  gap: 8px;
}

.hcp-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0;
  padding: 10px 14px;
  font-size: 0.95rem;
}
</style>
