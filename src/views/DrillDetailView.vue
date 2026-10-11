<template>
  <section class="drill-detail-view">
    <!-- Loading state -->
    <output v-if="!catalog.loaded" class="p-4 flex items-center justify-center" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span class="text-sm muted">Lade Drill…</span>
    </output>

    <!-- Content -->
    <template v-else>
      <DrillDetail v-if="drill" :drill="drill"/>

      <!-- Not found state -->
      <div v-else class="card not-found" role="status" data-testid="drill-not-found">
        <h2 class="not-found-title">Drill nicht gefunden</h2>
        <p class="text-sm muted flush">Die angeforderte Übung mit ID „{{ id }}“ existiert nicht.</p>
        <div class="row mt-card">
          <RouterLink class="btn" :to="preserve({ name: 'DrillsList' })">Zurück zur Liste</RouterLink>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import DrillDetail from '@/components/DrillDetail.vue'
import {useDrillCatalogStore} from '@/stores/drillCatalog'
import {computed, onMounted, watch, nextTick} from 'vue'
import {useRoute} from 'vue-router'
import { withPreservedQuery } from '@/router'
const route = useRoute()
const preserve = (to: any) => withPreservedQuery(to, route)

const catalog = useDrillCatalogStore()
const id = computed(() => String(route.params.id ?? ''))

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
})

// Ensure we scroll to top when this view is shown or when the drill id changes.
// Some child components may steal focus later, so run after the next tick.
onMounted(async () => {
  await nextTick()
  const mainEl = globalThis.document?.querySelector('main')
  if (mainEl && typeof (mainEl as any).scrollTo === 'function') {
    (mainEl as any).scrollTo({top: 0, left: 0, behavior: 'auto'})
  } else if (globalThis.window !== undefined && typeof globalThis.window.scrollTo === 'function') {
    globalThis.window.scrollTo({top: 0, left: 0, behavior: 'auto'})
  }
})

watch(id, async () => {
  await nextTick()
  const mainEl2 = globalThis.document?.querySelector('main')
  if (mainEl2 && typeof (mainEl2 as any).scrollTo === 'function') {
    (mainEl2 as any).scrollTo({top: 0, left: 0, behavior: 'auto'})
  } else if (globalThis.window !== undefined && typeof globalThis.window.scrollTo === 'function') {
    globalThis.window.scrollTo({top: 0, left: 0, behavior: 'auto'})
  }
})

const drill = computed(() => catalog.drills.find(d => d.id === id.value))
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-width: 720px;
  margin: 0 auto;
}

.not-found-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.drill-detail-view {
  width: 100%;
  /* Let the outer app container handle horizontal padding; keep only vertical spacing here. */
  padding: 12px 0 calc(24px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  display: block;
  overflow-x: hidden;
}

.drill-detail-view > :deep(*) {
  /* Make the wrapper's used width deterministic and include padding in the
     box-sizing so measurements reflect the visible outer size. We compute
     a responsive width and cap it with a max-width. Using an explicit
     width + max-width (instead of min()) reduces ambiguity when measuring
     via offsetWidth/clientWidth vs computed style. */
  box-sizing: border-box;
  /* Start from the viewport minus symmetric gutters (32px), but never exceed 720px */
  width: calc(100vw - 32px);
  max-width: 720px;
  margin: 0 auto;
  /* Symmetric internal gutter so content appears centered on narrow viewports */
  padding-inline: 16px;
  padding-inline-end: 16px;
}
</style>
