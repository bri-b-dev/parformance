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
  border-radius: var(--radius-pill);
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
  color: var(--level-1-ink);
  border-color: color-mix(in oklab, var(--level-1-ink) 45%, var(--border));
  background: color-mix(in oklab, var(--level-1-ink) 12%, transparent);
}

.lvl-2 {
  color: var(--level-2-ink);
  border-color: color-mix(in oklab, var(--level-2-ink) 45%, var(--border));
  background: color-mix(in oklab, var(--level-2-ink) 12%, transparent);
}

.lvl-3 {
  color: var(--primary);
  border-color: color-mix(in oklab, var(--primary) 50%, var(--border));
  background: color-mix(in oklab, var(--primary) 14%, transparent);
  font-weight: 700;
}
</style>
