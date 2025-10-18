<template>
  <div class="app">
    <header class="app-header">
      <div class="bar container">
        <div class="brand">
          <img src="/logo-header.svg" alt="ParFormance" class="logo" />
          <span>ParFormance</span>
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

const {theme, toggle} = useTheme();
</script>