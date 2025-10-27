<template>
  <article class="drill-card card" style="flex:1 1 280px;">
    <header style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <RouterLink :to="{ name: 'DrillDetail', params: { id: drill.id } }" style="font-weight:700; text-decoration:none; color:inherit">
        {{ drill.title }}
      </RouterLink>
      <small class="chip">{{ difficultyLabel }}</small>
    </header>
    <p style="color:var(--muted); margin:.25rem 0 0" class="category">{{ drill.category }}</p>
    <p v-if="drill.instructions?.training" style="margin:.5rem 0 0">{{ drill.instructions.training }}</p>
    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span class="chip" v-for="t in drill.tags" :key="t">{{ t }}</span>
    </div>
    <footer style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
      <RouterLink :to="{ name: 'DrillDetail', params: { id: drill.id } }" class="btn" aria-label="Details">Details</RouterLink>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { Drill } from '@/types'
import { computed } from 'vue'

const props = defineProps<{ drill: Drill }>()

const difficultyLabel = computed(() => {
  // Use difficulty.base when available, otherwise use 3 as neutral default
  // @ts-ignore difficulty optional in spec
  const base = (props.drill as any).difficulty?.base ?? 3
  return `★ ${base}`
})

</script>
