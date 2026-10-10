<template>
  <nav class="progress-tabs" aria-label="Fortschritt">
    <RouterLink :to="{ name: 'Progress' }" class="progress-tab" exact-active-class="active" :aria-current="route.name === 'Progress' ? 'page' : undefined">Übersicht</RouterLink>
    <RouterLink :to="{ name: 'ProgressHistory' }" class="progress-tab" exact-active-class="active" :aria-current="route.name === 'ProgressHistory' ? 'page' : undefined">Verlauf</RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.progress-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  margin: 6px 0 10px;
}

.progress-tab {
  padding: 6px 16px;
  border-radius: 999px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
}

.progress-tab.active {
  background: var(--primary);
  color: var(--primary-ink);
}
</style>
