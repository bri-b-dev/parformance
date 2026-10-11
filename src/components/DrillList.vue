<template>
  <div ref="root" class="catalog" :style="{ '--cat-bar-h': barHeight + 'px' }">
    <!-- Loading state -->
    <output v-if="!catalog.loaded" class="p-4 flex items-center justify-center muted" aria-live="polite">
      <svg aria-hidden="true" class="cat-spinner" width="20" height="20" viewBox="0 0 24 24">
        <g transform="translate(12,12)">
          <circle cx="0" cy="0" r="9" fill="none" stroke="var(--border)" stroke-width="2" stroke-opacity="0.9"></circle>
          <path d="M9 0 A9 9 0 0 1 7.5 -6" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
      <span class="text-sm muted">Lade Trainingsspiele…</span>
    </output>

    <template v-else>
      <DrillsTabs />
      <HcpHint />

      <!-- Search stays on top while scrolling -->
      <div ref="bar" class="cat-bar" data-testid="catalog-bar">
        <label class="sr-only" for="catalog-search">Drills suchen</label>
        <input id="catalog-search" v-model="searchText" class="input cat-search" type="search" enterkeyhint="search" autocomplete="off" placeholder="Suchen: Titel, Tags, Beschreibung"
          data-testid="catalog-search" @input="onSearchInput" @keydown.enter="flushSearch" />
        <button ref="filterBtn" type="button" class="btn cat-filter" aria-haspopup="dialog" :aria-expanded="sheetOpen" data-testid="filter-open" @click="sheetOpen = true">
          Filter<span v-if="chips.length" class="cat-badge" :aria-label="`${chips.length} aktiv`" data-testid="filter-badge">{{ chips.length }}</span>
        </button>
      </div>

      <div v-if="chips.length" class="cat-chips" role="group" aria-label="Aktive Filter" data-testid="active-chips">
        <button v-for="c in chips" :key="c.key" type="button" class="chip fchip on" :aria-label="`Filter ${c.label} entfernen`" data-testid="active-chip" @click="clear(c.key)">{{ c.label }} ✕</button>
        <button type="button" class="btn cat-reset" data-testid="chips-reset" @click="reset">Alle zurücksetzen</button>
      </div>

      <p class="muted cat-count" aria-live="polite" data-testid="result-count">{{ filtered.length }} von {{ catalog.drills.length }} Drills</p>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="card cat-empty" data-testid="catalog-empty" aria-live="polite">
        <h3>Keine Drills gefunden</h3>
        <p class="muted">Passe die Suche an oder lockere die Filter.</p>
        <button type="button" class="btn btn-primary" data-testid="empty-reset" @click="reset">Filter zurücksetzen</button>
      </div>

      <!-- Groups with sticky headings -->
      <section v-for="g in groups" v-else :key="g.category" class="cat-group" :aria-labelledby="`cat-${slug(g.category)}`" data-testid="catalog-group">
        <h2 :id="`cat-${slug(g.category)}`" class="cat-head">{{ g.category }} <small class="muted">{{ g.drills.length }}</small></h2>
        <div class="row">
          <DrillCard v-for="d in g.drills" :key="d.id" :drill="d" />
        </div>
      </section>

      <FilterSheet v-if="sheetOpen" :filter="filter" :drills="catalog.drills" :result-count="filtered.length" :has-favorites="favorites.list.length > 0"
        :target-known="targetKnown" @update="update" @reset="reset" @close="sheetOpen = false" />
    </template>
  </div>
</template>

<script setup lang="ts">
import DrillCard from '@/components/DrillCard.vue'
import DrillsTabs from '@/components/DrillsTabs.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import HcpHint from '@/components/HcpHint.vue'
import { useCatalogFilter } from '@/composables/useCatalogFilter'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import { activeChips, filterCatalog, groupByCategory } from '@/filters/catalog'
import { computeAreasOfImprovement } from '@/stats/areas'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const catalog = useDrillCatalogStore()
const favorites = useFavoritesStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const { hcp: currentHcp } = useCurrentHcp()

const { filter, searchText, update, clear, reset, onSearchInput, flushSearch } = useCatalogFilter()

const sheetOpen = ref(false)

onMounted(async () => {
  await Promise.all([catalog.load(), favorites.load(), sessions.loaded ? null : sessions.load(), settings.loaded ? null : settings.load()])
  await nextTick()
  measure()
})

const chips = computed(() => activeChips(filter.value))
const targetKnown = computed(() => currentHcp.value !== null || settings.targetHcp !== null)

const context = computed(() => {
  const played = new Set(sessions.sessions.map(s => s.drillId))
  let below = new Set<string>()
  if (filter.value.belowTarget && targetKnown.value) {
    below = new Set(computeAreasOfImprovement(sessions.sessions, catalog.drills, currentHcp.value, { mode: 'current', targetHcp: settings.targetHcp }).belowTarget.map(a => a.id))
  }
  return { favorites: new Set(favorites.list), played, belowTarget: below }
})

const filtered = computed(() => filterCatalog(catalog.drills, filter.value, context.value))
const groups = computed(() => groupByCategory(filtered.value))
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// the sticky group headings sit right below the search bar: publish its height
const bar = ref<HTMLElement | null>(null)
const barHeight = ref(56)
let observer: ResizeObserver | null = null

function measure() {
  if (bar.value) barHeight.value = bar.value.offsetHeight
  if (typeof ResizeObserver !== 'undefined' && bar.value && !observer) {
    observer = new ResizeObserver(() => { if (bar.value) barHeight.value = bar.value.offsetHeight })
    observer.observe(bar.value)
  }
}

watch(() => catalog.loaded, async (l) => { if (l) { await nextTick(); measure() } })
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.cat-spinner {
  margin-right: var(--space-2);
}

.catalog {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-bar {
  position: sticky;
  top: var(--app-header-h, 0px);
  z-index: 15;
  display: flex;
  gap: 8px;
  padding: 8px 0;
  background: var(--bg);
}

.cat-search {
  flex: 1;
  min-width: 0;
}

.cat-filter {
  position: relative;
  flex: none;
  min-height: 44px;
}

.cat-badge {
  margin-left: 6px;
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--primary-ink);
  font-size: 0.8rem;
  font-weight: 700;
}

.cat-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.fchip {
  cursor: pointer;
  min-height: 32px;
}

.fchip.on {
  background: color-mix(in oklab, var(--primary) 16%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.cat-reset {
  min-height: 32px;
  padding: 0 10px;
}

.cat-count {
  margin: 0;
  font-size: 0.9rem;
}

.cat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.cat-empty h3,
.cat-empty p {
  margin: 0;
}

.cat-head {
  position: sticky;
  top: calc(var(--app-header-h, 0px) + var(--cat-bar-h, 56px));
  z-index: 10;
  margin: 0;
  padding: 6px 0;
  font-size: 1rem;
  font-weight: 800;
  background: var(--bg);
}

.cat-group .row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
</style>
