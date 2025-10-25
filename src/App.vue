<template>
  <div class="app">
    <header class="app-header">
      <div class="bar container">
        <div class="brand">
          <img src="/logo-header.svg" alt="ParFormance" class="logo" />
          <span>ParFormance</span>
          <span class="chip" style="margin-left:12px; font-size:0.9rem;" v-if="streaksLoaded">
            Streak: <strong>{{ streaks.current }}</strong>
            <small style="color:var(--muted); margin-left:6px;">(best {{ streaks.best }})</small>
          </span>
        </div>
        <button class="btn" @click="toggle()" :aria-label="theme==='dark'?'Switch to light':'Switch to dark'">
          <span v-if="theme==='dark'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </div>
    </header>
    <main class="container">
      <RouterView/>
    </main>
    <BottomTabs/>
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import {useTheme} from '@/composables/useTheme';
import { onMounted, computed } from 'vue'
import { useStreaksStore } from '@/stores/streaks'
import { useSessionsStore } from '@/stores/sessions'

const {theme, toggle} = useTheme();

const sessions = useSessionsStore()
const streaksStore = useStreaksStore()
const streaks = computed(() => ({ current: streaksStore.current, best: streaksStore.best }))
const streaksLoaded = computed(() => sessions.loaded)

onMounted(async () => {
  if (!sessions.loaded) await sessions.load()
})
</script>