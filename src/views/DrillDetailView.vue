<template>
  <section class="p-4">
    <h1 class="text-xl font-semibold">Drill Detail</h1>
    <p class="text-sm text-gray-600">ID: {{ id }}</p>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
</script>
