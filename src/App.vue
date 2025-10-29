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

    <ShuffleFab />
    <BottomTabs />
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import ShuffleFab from '@/components/ShuffleFab.vue'
import RandomizerView from '@/views/RandomizerView.vue'
import HeaderBar from './components/HeaderBar.vue'
import { onMounted, ref } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { useUiStore } from '@/stores/ui'

const sessions = useSessionsStore()
const ui = useUiStore()

const shuffleOpen = ref(false)
function openShuffle() { shuffleOpen.value = true }
function onOpenSettings() { /* open settings drawer later */ }

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})
</script>