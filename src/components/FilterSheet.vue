<template>
  <DialogShell variant="bottom" layer="sheet" labelledby="fs-title" initial-focus='[data-testid="fs-apply"]' backdrop-testid="filter-sheet-backdrop" class="fs" @close="emit('close')">
      <header class="fs-head">
        <h2 id="fs-title" class="fs-title">Filter</h2>
        <button type="button" class="btn" data-testid="fs-reset" :disabled="!hasFilters" @click="emit('reset')">Zurücksetzen</button>
      </header>

      <div class="fs-body">
        <section aria-labelledby="fs-cat">
          <h3 id="fs-cat" class="fs-h">Kategorie</h3>
          <div class="fs-chips">
            <button v-for="c in categories" :key="c" type="button" class="chip fchip" :class="{ on: filter.category === c }" :aria-pressed="filter.category === c"
              @click="emit('update', { category: filter.category === c ? '' : c })">{{ c }}</button>
          </div>
        </section>

        <section aria-labelledby="fs-place">
          <h3 id="fs-place" class="fs-h">Ort</h3>
          <div class="fs-chips">
            <button v-for="g in LOCATION_GROUPS" :key="g" type="button" class="chip fchip" :class="{ on: filter.place === g }" :aria-pressed="filter.place === g"
              @click="emit('update', { place: filter.place === g ? '' : g })">{{ g }}</button>
          </div>
        </section>

        <section aria-labelledby="fs-dur">
          <h3 id="fs-dur" class="fs-h">Dauer</h3>
          <div class="fs-chips">
            <button v-for="m in DURATION_OPTIONS" :key="m" type="button" class="chip fchip" :class="{ on: filter.maxMinutes === m }" :aria-pressed="filter.maxMinutes === m"
              @click="emit('update', { maxMinutes: filter.maxMinutes === m ? 0 : m })">bis {{ m }} Min.</button>
          </div>
        </section>

        <section aria-labelledby="fs-diff">
          <h3 id="fs-diff" class="fs-h">Schwierigkeit</h3>
          <div class="fs-chips">
            <button v-for="o in DIFFICULTY_OPTIONS" :key="o.value" type="button" class="chip fchip" :class="{ on: filter.difficulty === o.value }" :aria-pressed="filter.difficulty === o.value"
              @click="emit('update', { difficulty: filter.difficulty === o.value ? '' : o.value })">{{ o.label }}</button>
          </div>
        </section>

        <section aria-labelledby="fs-tag">
          <h3 id="fs-tag" class="fs-h">Tags</h3>
          <div class="fs-chips" data-testid="fs-tags">
            <button v-for="t in shownTags" :key="t.tag" type="button" class="chip fchip" :class="{ on: filter.tag === t.tag }" :aria-pressed="filter.tag === t.tag"
              @click="emit('update', { tag: filter.tag === t.tag ? '' : t.tag })">{{ t.tag }} <small class="muted">{{ t.count }}</small></button>
          </div>
          <button v-if="tags.length > TOP_TAGS" type="button" class="btn fs-more" data-testid="fs-more-tags" :aria-expanded="allTagsShown" @click="allTagsShown = !allTagsShown">
            {{ allTagsShown ? 'Weniger Tags' : `Alle ${tags.length} Tags` }}
          </button>
        </section>

        <section aria-labelledby="fs-more" class="fs-switches">
          <h3 id="fs-more" class="fs-h">Weitere</h3>
          <label class="fs-switch">
            <input type="checkbox" role="switch" :checked="filter.favorites" :disabled="!hasFavorites && !filter.favorites" data-testid="fs-fav" @change="emit('update', { favorites: ($event.target as HTMLInputElement).checked })" />
            <span>Nur Favoriten <small v-if="!hasFavorites" class="muted">- markiere Drills mit ☆</small></span>
          </label>
          <label class="fs-switch">
            <input type="checkbox" role="switch" :checked="filter.unplayed" data-testid="fs-new" @change="emit('update', { unplayed: ($event.target as HTMLInputElement).checked })" />
            <span>Noch nie gespielt</span>
          </label>
          <label class="fs-switch">
            <input type="checkbox" role="switch" :checked="filter.belowTarget" :disabled="!targetKnown && !filter.belowTarget" data-testid="fs-low" @change="emit('update', { belowTarget: ($event.target as HTMLInputElement).checked })" />
            <span>Unter Ziel <small v-if="!targetKnown" class="muted">- dafür brauchen wir dein Handicap</small></span>
          </label>
        </section>
      </div>

      <footer class="fs-foot">
        <button type="button" class="btn btn-primary" data-testid="fs-apply" @click="emit('close')">{{ resultCount }} {{ resultCount === 1 ? 'Drill' : 'Drills' }} anzeigen</button>
      </footer>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import { allTags, DIFFICULTY_OPTIONS, DURATION_OPTIONS, isFiltered, type CatalogFilter } from '@/filters/catalog'
import { LOCATION_GROUPS } from '@/filters/location'
import type { Drill } from '@/types'
import { computed, ref } from 'vue'

const TOP_TAGS = 12

const props = defineProps<{
  filter: CatalogFilter
  drills: Drill[]
  resultCount: number
  hasFavorites: boolean
  /** Whether "below target" can be computed (a handicap or a target handicap is known). */
  targetKnown: boolean
}>()

const emit = defineEmits<{
  (e: 'update', patch: Partial<CatalogFilter>): void
  (e: 'reset'): void
  (e: 'close'): void
}>()

const allTagsShown = ref(false)

const categories = computed(() => Array.from(new Set(props.drills.map(d => d.category))).sort((a, b) => a.localeCompare(b, 'de')))
const tags = computed(() => allTags(props.drills))
// an active tag stays visible even if it is not among the most used
const shownTags = computed(() => {
  if (allTagsShown.value) return tags.value
  const top = tags.value.slice(0, TOP_TAGS)
  const active = tags.value.find(t => t.tag === props.filter.tag)
  return active && !top.includes(active) ? [...top, active] : top
})
const hasFilters = computed(() => isFiltered(props.filter))

</script>

<style scoped>
.fs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fs-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}

.fs-body {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.fs-h {
  margin: 0 0 6px;
  font-size: 0.9rem;
  color: var(--muted);
  font-weight: 700;
}

.fs-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fchip {
  cursor: pointer;
  min-height: 34px;
}

.fchip.on {
  background: color-mix(in oklab, var(--primary) 16%, transparent);
  color: var(--primary);
  font-weight: 700;
}

.fs-more {
  margin-top: 8px;
}

.fs-switches {
  display: flex;
  flex-direction: column;
}

.fs-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

.fs-switch input {
  width: 20px;
  height: 20px;
}

.fs-foot .btn {
  width: 100%;
  min-height: 48px;
}
</style>
