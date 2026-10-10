<template>
  <div class="fs-backdrop" data-testid="filter-sheet-backdrop" @click.self="emit('close')">
    <div ref="panel" class="card fs" role="dialog" aria-modal="true" aria-labelledby="fs-title" @keydown.esc.stop="emit('close')" @keydown.tab="trapTab">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { allTags, DIFFICULTY_OPTIONS, DURATION_OPTIONS, isFiltered, type CatalogFilter } from '@/filters/catalog'
import { LOCATION_GROUPS } from '@/filters/location'
import type { Drill } from '@/types'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

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

const panel = ref<HTMLElement | null>(null)
const allTagsShown = ref(false)
let opener: HTMLElement | null = null

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

function focusables(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>('button, input, [href]') ?? []).filter(el => !(el as HTMLButtonElement).disabled)
}

function trapTab(e: KeyboardEvent) {
  const items = focusables()
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  panel.value?.querySelector<HTMLElement>('[data-testid="fs-apply"]')?.focus()
})

onUnmounted(() => { if (opener?.isConnected) opener.focus() })
</script>

<style scoped>
.fs-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}

.fs {
  width: min(560px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  border-radius: 18px 18px 0 0;
  margin: 0;
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
