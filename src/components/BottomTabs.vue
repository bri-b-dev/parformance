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
      <RouterLink class="tab" :class="{ active: isActive('/favorites') }" to="/favorites">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l2.6 5.3 5.9.9-4.3 4.2 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.3-4.2 5.9-.9L12 3z"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>Favoriten</span>
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
      <RouterLink class="tab" :class="{ active: isActive('/construction') }" to="/construction">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l9 16H3l9-16z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M12 10v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round" />
            <circle cx="12" cy="17" r="0.9" fill="currentColor" />
          </svg>
        </span>
        <span>Baustellen</span>
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