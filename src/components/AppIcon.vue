<template>
  <svg class="app-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'" :role="label ? 'img' : undefined" :aria-label="label" focusable="false" data-testid="app-icon" :data-icon="name" v-html="ICONS[name]"></svg>
</template>

<script setup lang="ts">
import { ICONS, type IconName } from '@/components/icons'

/** One icon set (outline, 24 px grid, `currentColor`) instead of emojis. Decorative unless a `label` is given. */
withDefaults(defineProps<{ name: IconName; size?: string | number; label?: string }>(), { size: '1.1em', label: undefined })
</script>

<style scoped>
.app-icon {
  flex: none;
  vertical-align: -0.18em;
}
</style>
