<template>
  <div class="hc-root">
    <nav class="hc-tabs" aria-label="Handicap">
      <RouterLink :to="{ name: 'HandicapCalculator' }" class="hc-tab" exact-active-class="active">
        <span class="material-icons" aria-hidden="true">calculate</span>
        <span>{{ $t('navCalculator') }}</span>
      </RouterLink>
      <RouterLink :to="{ name: 'HandicapHistory' }" class="hc-tab" active-class="active">
        <span class="material-icons" aria-hidden="true">insights</span>
        <span>{{ $t('navHistory') }}</span>
      </RouterLink>
      <RouterLink :to="{ name: 'HandicapSettings' }" class="hc-tab" active-class="active">
        <span class="material-icons" aria-hidden="true">settings</span>
        <span>{{ $t('navSettings') }}</span>
      </RouterLink>
      <RouterLink :to="{ name: 'HandicapFaq' }" class="hc-tab" active-class="active">
        <span class="material-icons" aria-hidden="true">quiz</span>
        <span>{{ $t('navFaq') }}</span>
      </RouterLink>
    </nav>
    <div class="hc-container">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useResults } from './composables/useResults'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import './assets/module.css'

const { locale } = useI18n()
const settings = useSettingsStore()
const { startupRecalc } = useResults()

// The language is an app-wide setting; vue-i18n only mirrors it.
watch(() => settings.language, (lang) => { locale.value = lang }, { immediate: true })

onMounted(async () => {
  if (!settings.loaded) await settings.load()
  locale.value = settings.language
  await startupRecalc()
})
</script>

<style scoped>
.hc-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
}

.hc-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  white-space: nowrap;
}

.hc-tab.active {
  background: var(--primary);
  color: #fff;
}

.hc-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem 1rem 6rem;
}
</style>
