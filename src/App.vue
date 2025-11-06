<template>
  <div class="app">
    <HeaderBar @shuffle="openShuffle" @open-settings="onOpenSettings" />

    <main>
      <div class="container">
        <RouterView />
      </div>
      <!-- Render the shuffle overlay as a real modal when toggled via the UI store -->
      <RandomizerView v-if="ui.shuffleOpen" />
    </main>

    <SettingsSheet :open="settingsOpen" @close="settingsOpen = false" />
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
import { useUiStore } from '@/stores/ui';
import RandomizerView from '@/views/RandomizerView.vue';
import { onMounted, ref } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import SettingsSheet from './components/SettingsSheet.vue'
import Toasts from './components/Toasts.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const sessions = useSessionsStore()
const ui = useUiStore()

function openShuffle() { ui.setShuffle(true) }

const settingsOpen = ref(false)
function onOpenSettings() { settingsOpen.value = true }

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})
</script>
