<template>
  <section class="gambler-panel card" aria-labelledby="gambler-title">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <h3 id="gambler-title" style="margin:0; font-weight:700;">Zocker-Tipp</h3>
      <button class="btn" :aria-expanded="!collapsed" @click="toggle" @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle">
        <span v-if="collapsed">Anzeigen</span>
        <span v-else>Verbergen</span>
      </button>
    </header>

    <div v-if="!collapsed" class="p-2 text-sm text-gray-600">
      <div v-if="tip && tip.length">{{ tip }}</div>
      <div v-else class="text-gray-600">Kein Zocker-Tipp verfügbar.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';
import { computed } from 'vue';

const props = defineProps<{ drillId: string; tip?: string }>()
const ui = useUiStore()

const collapsed = computed(() => ui.isGamblerCollapsed(props.drillId))

function toggle() {
  ui.setGamblerCollapsed(props.drillId, !collapsed.value)
}
</script>

<style scoped>
.gambler-panel {
  margin-top: 10px
}
</style>
