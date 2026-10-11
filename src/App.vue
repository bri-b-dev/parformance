<template>
  <div class="app">
    <HeaderBar @shuffle="openShuffle" @open-settings="ui.setSettings(true)" />

    <main>
      <div class="container relative">
        <RouterView v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
      <!-- Render the shuffle overlay as a real modal when toggled via the UI store -->
      <RandomizerView v-if="ui.shuffleOpen" />
    </main>

    <!-- loaded on first use: it pulls in most stores and is rarely opened -->
    <SettingsSheet v-if="settingsSeen" :open="ui.settingsOpen" @close="ui.setSettings(false)" />
    <!-- first run only, so returning users do not load it -->
    <OnboardingModal v-if="settings.loaded && !settings.onboardingDone" />
    <BottomTabs />
    <Toasts />
    <ConfirmModal />
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import { useSessionsStore } from '@/stores/sessions';
import { useHcpHistoryStore } from '@/stores/hcpHistory';
import { useRoundsStore } from '@/stores/rounds';
import { useUiStore } from '@/stores/ui';
import { defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import HeaderBar from './components/HeaderBar.vue'
import { useSettingsStore } from '@/stores/settings';
import { useI18n } from 'vue-i18n';
import Toasts from './components/Toasts.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const sessions = useSessionsStore()
const ui = useUiStore()
const hcpHistory = useHcpHistoryStore()
const rounds = useRoundsStore()

function openShuffle() { ui.setShuffle(true) }

const settings = useSettingsStore()
// the language switches without restart: vue-i18n and <html lang> follow the setting
const { locale } = useI18n()
watch(() => settings.language, (lang) => {
  locale.value = lang
  document.documentElement.lang = lang
}, { immediate: true })
const route = useRoute()
// the overlay belongs to a screen: leaving the screen (e.g. browser back) closes it
watch(() => route.fullPath, () => ui.setShuffle(false))
const RandomizerView = defineAsyncComponent(() => import('@/views/RandomizerView.vue'))
const OnboardingModal = defineAsyncComponent(() => import('./components/OnboardingModal.vue'))
const SettingsSheet = defineAsyncComponent(() => import('./components/SettingsSheet.vue'))
const settingsSeen = ref(false)
watch(() => ui.settingsOpen, (open) => { if (open) settingsSeen.value = true }, { immediate: true })

onMounted(async () => {
  if (!settings.loaded) await settings.load()
  // HCP from rounds (Dexie loads in the background and the series updates reactively)
  void rounds.start()
  if (!sessions.loaded) await sessions.load()
  if (!hcpHistory.loaded) await hcpHistory.load()
})
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease-out;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
