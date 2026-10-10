<template>
  <span class="level-stars" :class="[`lvl-${level ?? 'none'}`, { compact }]" :aria-label="label" role="img" data-testid="level-stars">
    <span aria-hidden="true" class="stars">{{ level === null ? '☆☆☆' : '★'.repeat(level) + '☆'.repeat(3 - level) }}</span>
    <span v-if="!compact" aria-hidden="true" class="text">{{ level === null ? 'Level -' : `Level ${level}` }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * The one way to show a level: stars (shape) plus the number (text) plus a color that grows with the level,
 * so it never relies on color alone.
 */
const props = defineProps<{ level: number | null; compact?: boolean }>()

const label = computed(() => (props.level === null ? 'Kein Level' : `Level ${props.level} von 3`))
</script>

<style scoped>
.level-stars {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  white-space: nowrap;
  color: var(--muted);
}

.level-stars.compact {
  padding: 2px 8px;
}

.stars {
  letter-spacing: 1px;
}

.text {
  font-weight: 600;
}

.lvl-1 {
  color: #8a5a00;
  border-color: color-mix(in oklab, #8a5a00 45%, var(--border));
  background: color-mix(in oklab, #c58a1a 14%, transparent);
}

.lvl-2 {
  color: #3d5360;
  border-color: color-mix(in oklab, #3d5360 45%, var(--border));
  background: color-mix(in oklab, #7f98a6 18%, transparent);
}

.lvl-3 {
  color: var(--primary);
  border-color: color-mix(in oklab, var(--primary) 50%, var(--border));
  background: color-mix(in oklab, var(--primary) 14%, transparent);
  font-weight: 700;
}

:global([data-theme='dark']) .lvl-1 {
  color: #e6b450;
}

:global([data-theme='dark']) .lvl-2 {
  color: #b9cbd6;
}
</style>
