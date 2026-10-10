<template>
  <aside v-if="settings.loaded && settings.onboardingDone && currentHcp == null" class="hcp-hint card" role="note">
    <span>Ohne Handicap können wir keine Zielwerte anzeigen. Trage es ein oder erfasse Runden im Handicap-Bereich.</span>
    <button type="button" class="btn btn-primary" @click="ui.setSettings(true)">Handicap eintragen</button>
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
