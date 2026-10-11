<template>
  <article class="drill-card card">
    <RouterLink :to="detailLink" class="card-thumb" tabindex="-1" aria-hidden="true">
      <DrillThumb :drill="drill" />
    </RouterLink>
    <div class="card-body">
      <header class="card-head">
        <RouterLink :to="detailLink" class="card-title">{{ drill.title }}</RouterLink>
        <LevelBadge :drill="drill" compact />
      </header>
      <div class="card-meta">
        <span class="chip" data-testid="card-minutes">{{ minutes }} Min.</span>
        <span class="chip" :aria-label="`Schwierigkeit ${difficulty} von 5`" :title="`Schwierigkeit ${difficulty} von 5`">{{ '●'.repeat(difficulty) }}{{ '○'.repeat(5 - difficulty) }}</span>
      </div>
      <p v-if="drill.summary ?? drill.instructions?.training" class="card-summary">{{ u(drill.summary ?? drill.instructions.training) }}</p>
      <div v-if="drill.tags?.length" class="chips">
        <span v-for="t in drill.tags" :key="t" class="chip">{{ t }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useUnits } from '@/units/useUnits'
import DrillThumb from '@/components/DrillThumb.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import { difficultyOf } from '@/filters/catalog'
import { withPreservedQuery } from '@/router'
import { drillMinutes } from '@/today/suggest'
import type { Drill } from '@/types'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { u } = useUnits()

const props = defineProps<{ drill: Drill }>()
const route = useRoute()

const detailLink = computed(() => withPreservedQuery({ name: 'DrillDetail', params: { id: props.drill.id } }, route))
const minutes = computed(() => drillMinutes(props.drill))
// difficulty (dots) is a property of the drill; the level (stars) is the player's result
const difficulty = computed(() => difficultyOf(props.drill))
</script>

<style scoped>
.drill-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1 1 320px;
  margin: 0;
}

.card-thumb {
  flex: none;
  display: block;
}

.card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  font-weight: 700;
  text-decoration: none;
  color: inherit;
  /* the whole card is reachable through the title link */
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-summary {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
