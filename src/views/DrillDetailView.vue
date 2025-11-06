<template>
  <section class="drill-detail-view">
    <!-- Loading state -->
    <output v-if="!catalog.loaded" class="p-4 flex items-center justify-center" aria-live="polite">
      <span class="inline-block h-5 w-5 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"
        aria-hidden="true"></span>
      <span class="text-sm text-gray-600">Lade Drill…</span>
    </output>

    <!-- Content -->
    <template v-else>
      <DrillDetail v-if="drill" :drill="drill" />

      <!-- Not found state -->
      <output v-else class="card" aria-live="polite">
        <h2 style="margin:0; font-size:1.1rem; font-weight:700;">Drill nicht gefunden</h2>
        <p class="text-sm text-gray-600" style="margin:.25rem 0 0;">Die angeforderte Übung mit ID „{{ id }}“ existiert
          nicht.</p>
        <div class="row" style="margin-top:10px;">
          <RouterLink class="btn" :to="{ name: 'DrillsList' }">Zurück zur Liste</RouterLink>
        </div>
      </output>
    </template>
  </section>
</template>

<script setup lang="ts">
import DrillDetail from '@/components/DrillDetail.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const catalog = useDrillCatalogStore()
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

onMounted(async () => {
  if (!catalog.loaded) await catalog.load()
})

const drill = computed(() => catalog.drills.find(d => d.id === id.value))
</script>

<style scoped>
.drill-detail-view {
  width: 100%;
  /* Let the outer app container handle horizontal padding; keep only vertical spacing here. */
  padding: 12px 0 calc(110px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  display: block;
  overflow-x: hidden;
}

.drill-detail-view > :deep(*) {
  width: 100%;
  /* Keep a responsive max width: never exceed 720px but leave symmetric gutters on small screens */
  max-width: min(720px, calc(100vw - 32px));
  margin: 0 auto;
  /* Symmetric internal gutter so content appears centered on narrow viewports */
  padding-inline: 16px;
  padding-inline-end: 16px;
}
</style>
