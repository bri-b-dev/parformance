<template>
  <div class="app">
    <header class="app-header">
      <div class="bar">
        <div class="brand" aria-label="ParFormance">
          <img src="/logo-header.svg" alt="ParFormance" class="logo" />
          <div style="display:flex; flex-direction:column; min-width:0">
            <span>ParFormance</span>
            <small class="tagline" style="display:block;">Train smarter — play better</small>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <button class="btn" @click="toggle()" :aria-label="theme==='dark'?'Switch to light':'Switch to dark'">
            <span v-if="theme==='dark'">🌙</span>
            <span v-else>☀️</span>
          </button>
          <button class="tab" aria-label="Einstellungen">⚙️</button>
        </div>
      </div>
    </header>

    <main>
      <div class="container">
        <RouterView/>
      </div>
      <!-- Render the shuffle overlay as a real modal when toggled via the UI store -->
      <RandomizerView v-if="ui.shuffleOpen" />
    </main>

    <ShuffleFab />
    <BottomTabs/>
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import ShuffleFab from '@/components/ShuffleFab.vue'
import RandomizerView from '@/views/RandomizerView.vue'
import {useTheme} from '@/composables/useTheme';
import { onMounted } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { useUiStore } from '@/stores/ui'

const {theme, toggle} = useTheme();

const sessions = useSessionsStore()
const ui = useUiStore()

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})
</script>