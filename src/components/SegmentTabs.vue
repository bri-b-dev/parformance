<template>
  <nav class="segment-tabs" :aria-label="label">
    <RouterLink v-for="item in items" :key="item.name" :to="item.to" class="segment-tab" :class="{ active: route.name === item.name }"
      :aria-current="route.name === item.name ? 'page' : undefined">{{ item.label }}</RouterLink>
  </nav>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { useRoute } from 'vue-router'

defineProps<{ label: string; items: { label: string; name: string; to: RouteLocationRaw }[] }>()
const route = useRoute()
</script>

<style scoped>
.segment-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--surface);
  margin: 6px 0 10px;
}

.segment-tab {
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
}

.segment-tab.active {
  background: var(--primary);
  color: var(--primary-ink);
}
</style>
