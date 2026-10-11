<template>
  <section class="gambler-panel card" aria-labelledby="gambler-title">
    <header class="section-head tip-head">
      <h3 id="gambler-title" class="section-title">Zocker-Tipp</h3>
      <button class="btn" :aria-expanded="!collapsed" @click="toggle" @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle">
        <span v-if="collapsed">Anzeigen</span>
        <span v-else>Verbergen</span>
      </button>
    </header>

    <div v-if="!collapsed" class="p-2 text-sm muted">
      <div v-if="tip && tip.length">{{ tip }}</div>
      <div v-else class="muted">Kein Zocker-Tipp verfügbar.</div>
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
  margin-top: 10px;
}

.tip-head {
  margin-bottom: 0;
}
</style>
