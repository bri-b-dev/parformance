<template>
  <SegmentTabs label="Drills" :items="items" />
</template>

<script setup lang="ts">
import SegmentTabs from '@/components/SegmentTabs.vue'

const items = [
  { label: 'Alle Drills', name: 'DrillsList', to: { name: 'DrillsList' } },
  { label: 'Sammlungen', name: 'Collections', to: { name: 'Collections' } },
]
</script>
