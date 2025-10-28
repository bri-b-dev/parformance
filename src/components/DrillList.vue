<template>
  <div>
    <!-- Loading state -->
    <output v-if="!catalog.loaded" class="p-4 flex items-center justify-center" aria-live="polite">
      <span class="inline-block h-5 w-5 mr-2 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-hidden="true"></span>
      <span class="text-sm text-gray-600">Lade Trainingsspiele…</span>
    </output>

    <!-- Content/filters are hidden until loaded to avoid flashing -->
    <template v-else>
      <section class="row" aria-labelledby="filter-heading">
        <h2 id="filter-heading" class="sr-only">Filter</h2>

        <div class="field" style="min-width:180px;">
          <label class="label" for="filter-category">Kategorie</label>
          <select id="filter-category" v-model="filterCategory" class="input">
            <option value="">Alle</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="field" style="min-width:220px; flex:1;">
          <label class="label" for="filter-query">Suche</label>
          <input id="filter-query" class="input" type="search" v-model.trim="filterQuery" placeholder="Titel suchen…" />
        </div>

        <div class="field" style="min-width:160px; display:flex; align-items:end;">
          <label class="chip" style="cursor:pointer;">
            <input id="filter-fav" type="checkbox" v-model="onlyFavorites" style="margin-right:6px" />
            Nur Favoriten
          </label>
        </div>
      </section>

      <div class="row">
        <button class="btn" type="button" @click="resetFilters">Filter löschen</button>
      </div>

      <!-- Empty state -->
      <output v-if="filtered.length === 0" class="p-6 text-center border border-dashed rounded-md border-gray-200 bg-gray-50" aria-live="polite">
        <h3 class="text-base font-semibold text-gray-800">Keine Drills gefunden</h3>
        <p class="text-sm text-gray-600 mt-1">Passe die Filter an oder ändere die Suche.</p>
      </output>

      <!-- List -->
      <div v-else class="row">
        <DrillCard v-for="d in filtered" :key="d.id" :drill="d" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { filterDrills } from '@/filters/drills'
import DrillCard from '@/components/DrillCard.vue'

const catalog = useDrillCatalogStore()
const favorites = useFavoritesStore()

// Filters
const filterCategory = ref<string>('')
const filterQuery = ref<string>('')
const onlyFavorites = ref<boolean>(false)

onMounted(async () => {
  await Promise.all([catalog.load(), favorites.load()])
})

const categories = computed(() => {
  const set = new Set<string>()
  for (const d of catalog.drills) set.add(d.category)
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  return filterDrills(catalog.drills, {
    category: filterCategory.value || undefined,
    query: filterQuery.value || undefined,
    onlyFavorites: onlyFavorites.value,
    favorites: favorites.list,
  })
})

function resetFilters() {
  filterCategory.value = ''
  filterQuery.value = ''
  onlyFavorites.value = false
}
</script>
