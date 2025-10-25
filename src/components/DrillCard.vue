<template>
  <article class="card" style="width:320px;">
    <header style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <h3 style="margin:0; font-weight:700;">{{ drill.title }}</h3>
      <small class="chip">{{ difficultyLabel }}</small>
    </header>
    <p style="color:var(--muted); margin:.25rem 0 0">{{ drill.category }}</p>
    <p v-if="drill.instructions?.training" style="margin:.5rem 0 0">{{ drill.instructions.training }}</p>
    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span class="chip" v-for="t in drill.tags" :key="t">{{ t }}</span>
    </div>
    <footer style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
      <button type="button" class="btn">Details</button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { Drill } from '@/types'

const props = defineProps<{ drill: Drill }>()

const difficultyLabel = computed(() => {
  // Use difficulty.base when available, otherwise use 3 as neutral default
  // @ts-ignore difficulty optional in spec
  const base = (props.drill as any).difficulty?.base ?? 3
  return `★ ${base}`
})

import { computed } from 'vue'
</script>
