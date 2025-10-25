<template>
  <div class="bottom-tabs">
    <nav>
      <RouterLink class="tab" :class="{ active: isActive('/') }" to="/">
<span class="icon" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</span>
        <span>Home</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/drills') }" to="/drills">
<span class="icon" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round"/>
</svg>
</span>
        <span>Drills</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/shuffle') }" to="/shuffle">
<span class="icon" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.6"/>
<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
<circle cx="12" cy="12" r="1.5" fill="currentColor"/>
<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
</svg>
</span>
        <span>Zufall</span>
      </RouterLink>
  <RouterLink class="tab" :class="{ active: isActive('/stats') }" to="/stats">
<span class="icon" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 6h16M4 12h8M4 18h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</span>
    <span>Stats</span>
  </RouterLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import {useRoute} from 'vue-router';

const route = useRoute();

function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/');
}
</script>
<style scoped>
.icon {
  line-height: 0;
  display: inline-flex;
}
</style>