<template>
  <div>
    <!-- Loading state -->
    <output v-if="!catalog.loaded" class="p-4 flex items-center justify-center" aria-live="polite"
      :style="{ color: 'var(--muted)' }">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" style="margin-right:8px">
        <g transform="translate(12,12)">
          <circle cx="0" cy="0" r="9" fill="none" stroke="var(--border)" stroke-width="2" stroke-opacity="0.9"></circle>
          <path d="M9 0 A9 9 0 0 1 7.5 -6" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
      <span class="text-sm" style="color:var(--muted)">Lade Trainingsspiele…</span>
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
      <output v-if="filtered.length === 0"
        class="p-6 text-center rounded-md" aria-live="polite"
        :style="{
          display: 'block',
          width: '100%',
          maxWidth: '820px',
          margin: '28px auto',
          background: 'color-mix(in oklab, var(--surface) 92%, var(--bg) 8%)',
          border: '1px solid var(--border)',
          color: 'var(--muted)'
        }">
        <h3 class="text-base font-semibold" :style="{ color: 'var(--text)', margin: 0 }">Keine Drills gefunden</h3>
        <p class="text-sm mt-1" style="margin:8px 0 0">Passe die Filter an oder ändere die Suche.</p>
      </output>

      <!-- List -->
      <div v-else class="row">
        <DrillCard v-for="d in filtered" :key="d.id" :drill="d" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import DrillCard from '@/components/DrillCard.vue'
import { filterDrills } from '@/filters/drills'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { computed, onMounted, ref } from 'vue'

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
