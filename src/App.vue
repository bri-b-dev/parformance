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

    <SettingsSheet :open="ui.settingsOpen" @close="ui.setSettings(false)" />
    <OnboardingModal />
    <ShuffleFab />
    <BottomTabs />
    <Toasts />
    <ConfirmModal />
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import ShuffleFab from '@/components/ShuffleFab.vue';
import { useSessionsStore } from '@/stores/sessions';
import { useHcpHistoryStore } from '@/stores/hcpHistory';
import { useUiStore } from '@/stores/ui';
import RandomizerView from '@/views/RandomizerView.vue';
import { onMounted } from 'vue';
import HeaderBar from './components/HeaderBar.vue'
import OnboardingModal from './components/OnboardingModal.vue'
import { useSettingsStore } from '@/stores/settings';
import SettingsSheet from './components/SettingsSheet.vue'
import Toasts from './components/Toasts.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const sessions = useSessionsStore()
const ui = useUiStore()
const hcpHistory = useHcpHistoryStore()

function openShuffle() { ui.setShuffle(true) }

const settings = useSettingsStore()

onMounted(async () => {
  if (!settings.loaded) await settings.load()
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
