<template>
  <article class="drill-card card" style="flex:1 1 280px;">
    <header style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <RouterLink :to="preserve({ name: 'DrillDetail', params: { id: drill.id } })"
        style="font-weight:700; text-decoration:none; color:inherit">
        {{ drill.title }}
      </RouterLink>
      <span class="card-meta">
        <LevelBadge :drill="drill" compact />
        <small class="chip" :aria-label="`Schwierigkeit ${difficulty} von 5`" :title="`Schwierigkeit ${difficulty} von 5`">{{ '●'.repeat(difficulty) }}{{ '○'.repeat(5 - difficulty) }}</small>
      </span>
    </header>
    <p style="color:var(--muted); margin:.25rem 0 0" class="category">{{ drill.category }}</p>
  <p v-if="drill.summary ?? drill.instructions?.training" style="margin:.5rem 0 0">{{ drill.summary ?? drill.instructions.training }}</p>
    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span v-for="t in drill.tags" :key="t" class="chip">{{ t }}</span>
    </div>
    <footer style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
      <RouterLink :to="preserve({ name: 'DrillDetail', params: { id: drill.id } })" class="btn" aria-label="Details">Details
      </RouterLink>
    </footer>
  </article>
</template>

<script setup lang="ts">
import LevelBadge from '@/components/LevelBadge.vue';
import type { Drill } from '@/types';
import { computed } from 'vue';
import { useRoute } from 'vue-router'
import { withPreservedQuery } from '@/router'

const props = defineProps<{ drill: Drill }>()
const route = useRoute()
const preserve = (to: any) => withPreservedQuery(to, route)

// difficulty (dots) is a property of the drill; the level (stars) is the player's result
const difficulty = computed(() => Math.min(5, Math.max(1, Math.round(props.drill.difficulty?.base ?? 3))))

</script>

<style scoped>
.card-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
