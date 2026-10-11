<template>
  <AppIcon v-if="name" :name="name" :size="size" />
  <span v-else-if="icon" aria-hidden="true" class="legacy">{{ icon }}</span>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { isIconName } from '@/components/icons'
import { computed } from 'vue'

/** A collection's icon: a name from the icon set, or (older data) a plain emoji shown as text. */
const props = defineProps<{ icon?: string; size?: string | number }>()
const name = computed(() => (isIconName(props.icon) ? props.icon : null))
</script>
