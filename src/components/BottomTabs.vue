<template>
  <div class="bottom-tabs">
    <nav>
      <RouterLink class="tab" :class="{ active: isActive('/') || isActive('/drills') }" to="/">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor"
              stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>Drills</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/history') }" to="/history">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
            <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </span>
        <span>Historie</span>
      </RouterLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';

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