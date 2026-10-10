<template>
  <SegmentTabs label="Fortschritt" :items="items" />
</template>

<script setup lang="ts">
import SegmentTabs from '@/components/SegmentTabs.vue'

const items = [
  { label: 'Übersicht', name: 'Progress', to: { name: 'Progress' } },
  { label: 'Verlauf', name: 'ProgressHistory', to: { name: 'ProgressHistory' } },
]
</script>
