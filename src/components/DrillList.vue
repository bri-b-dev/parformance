<template>
  <div>
    <div class="row">
      <div class="field" style="min-width:180px;">
        <label class="label">Kategorie</label>
        <select v-model="filterCategory" class="input">
          <option value="">Alle</option>
          <option value="chipping">Chipping</option>
          <option value="putting">Putting</option>
          <option value="driving">Driving</option>
          <option value="irons">Irons</option>
          <option value="bunker">Bunker</option>
        </select>
      </div>
      <div class="field" style="min-width:220px; flex:1;">
        <label class="label">Tags</label>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <label v-for="t in uniqueTags" :key="t" class="chip" style="cursor:pointer;">
            <input type="checkbox" :value="t" v-model="filterTagsAny" style="margin-right:6px"/>
            {{ t }}
          </label>
        </div>
      </div>
    </div>
    <div class="row">
      <button class="btn" @click="filterCategory = ''; filterTagsAny = []">Filter löschen</button>
    </div>

    <div class="row">
      <article class="card" v-for="d in filtered" :key="d.id" style="flex:1 1 280px;">
        <header style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <RouterLink :to="`/drills/${d.id}`" style="font-weight:700; text-decoration:none; color:inherit">
            {{ d.title }}
          </RouterLink>
          <small class="chip">★ {{ d.difficulty ?? 3 }}</small>
        </header>
        <p style="color:var(--muted); margin:.5rem 0 0">{{ d.category }}</p>
        <p v-if="d.description" style="margin:.5rem 0 0">{{ d.description }}</p>
        <div v-if="d.tags?.length" class="chips" style="margin-top:8px;">
          <span class="chip" v-for="t in d.tags" :key="t">{{ t }}</span>
        </div>
        <hr class="hr"/>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <RouterLink class="btn" :to="`/drills/${d.id}`">Bearbeiten</RouterLink>
          <button class="btn" @click="del(d.id)">Löschen</button>
        </div>
      </article>
    </div>

    <div style="margin-top:16px;">
      <RouterLink class="btn btn-primary" to="/drills/new">Neues Spiel</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useDrillStore} from '@/stores/drills'
import type {DrillCategory} from '@/types/drill'

const store = useDrillStore()

// Filterzustand
const filterCategory = ref<string>('')
const filterTagsAny = ref<string[]>([])

// initial laden
onMounted(() => store.load())

// gefilterte Liste
const uniqueTags = computed(() => {
  const set = new Set<string>()
  for (const d of store.drills) (d.tags ?? []).forEach(t => set.add(t))
  return [...set].sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  let arr = store.drills
  if (filterCategory.value) {
    arr = arr.filter(d => d.category === (filterCategory.value as DrillCategory))
  }
  if (filterTagsAny.value.length > 0) {
    arr = arr.filter(d => (d.tags ?? []).some(t => filterTagsAny.value.includes(t)))
  }
  return arr
})

// löschen mit Bestätigung
async function del(id: string) {
  if (confirm('Wirklich löschen?')) {
    await store.remove(id)
  }
}
</script>
