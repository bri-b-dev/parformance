<template>
  <section class="row">
    <div class="card" style="flex:1 1 260px;">
      <h2 style="margin:0 0 8px 0;">Zufallsgenerator</h2>
      <div class="row">
        <div class="field" style="min-width:180px; flex:1">
          <label class="label">Kategorie</label>
          <select class="input" v-model="category" :disabled="isShuffling">
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
              <input
                  type="checkbox"
                  :value="t"
                  v-model="tagsAny"
                  style="margin-right:6px"
                  :disabled="isShuffling"
              />
              {{ t }}
            </label>
          </div>
        </div>
        <div class="field" style="min-width:160px;">
          <label class="label">Max. Schwierigkeit</label>
          <input class="input" type="number" min="1" max="5" v-model.number="maxDifficulty" :disabled="isShuffling"/>
        </div>
        <div class="field" style="align-self:flex-end;">
          <button class="btn btn-primary" @click="roll" :disabled="isShuffling">
            <span v-if="!isShuffling">Ziehen</span>
            <span v-else>Shuffling…</span>
          </button>
          <button class="btn" @click="category = ''; tagsAny = []; tagsAll = []">Filter löschen</button>
        </div>
      </div>
      <p v-if="error" style="color:var(--muted); margin:.5rem 0 0;">{{ error }}</p>
    </div>


    <article class="card" style="flex:2 1 320px;">
      <template v-if="display">
        <h3 :class="{ reel: isShuffling }" style="margin:0;">{{ display.title }}</h3>
        <p class="chip" style="display:inline-block; margin-top:6px;">★ {{ display.difficulty ?? 3 }}</p>
        <p style="color:var(--muted); margin:.5rem 0 0">
          <strong>Kategorie:</strong> {{ display.category }} ·
          <strong>Dauer:</strong> {{ display.durationMin ?? '—' }} Min
        </p>
        <p style="margin:.5rem 0 0">{{ display.description }}</p>
        <div v-if="display.tags?.length" class="chips" style="margin-top:8px;">
          <span class="chip" v-for="t in display.tags" :key="t">{{ t }}</span>
        </div>
      </template>
      <template v-else>
        <h3 style="margin:0;">Noch nichts gezogen</h3>
        <p style="color:var(--muted);">Klicke auf <em>Ziehen</em>, um ein zufälliges Trainingsspiel zu erhalten. Falls
          keine Einträge vorhanden sind, lege welche unter <strong>Drills</strong> an.</p>
      </template>
    </article>
  </section>
</template>


<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, computed} from 'vue';
import {useDrillStore} from '@/stores/drills';
import type {Drill, DrillCategory} from '@/types/drill';


const store = useDrillStore();
const display = ref<Drill | null>(null); // aktuell angezeigter (während Shuffle wechselnd)
const result = ref<Drill | null>(null); // final gezogener
const category = ref<'' | DrillCategory>('');
const maxDifficulty = ref<number | null>(null);
const isShuffling = ref(false);
const error = ref<string | null>(null);
let timer: number | null = null;
const TICK_MS = 85; // Wechselgeschwindigkeit
const DURATION_MS = 900; // Gesamtdauer der Shuffle-Animation

const tagsAny = ref<string[]>([])
// Wenn du zusätzlich eine UND-Logik willst, leg z. B. tagsAll an und bau einen zweiten Block wie oben.
const tagsAll = ref<string[]>([])

const uniqueTags = computed(() => {
  const set = new Set<string>()
  for (const d of store.drills) (d.tags ?? []).forEach(t => set.add(t))
  return [...set].sort((a, b) => a.localeCompare(b))
})

onMounted(async () => {
  await store.load();
});
onBeforeUnmount(() => {
  stopTimer();
});


function pool() {
  let p = [...store.drills]
  if (category.value) p = p.filter(d => d.category === category.value)
  if (maxDifficulty.value != null) p = p.filter(d => (d.difficulty ?? 3) <= (maxDifficulty.value as number))
  if (tagsAny.value.length > 0) p = p.filter(d => (d.tags ?? []).some(t => tagsAny.value.includes(t)))
  if (tagsAll.value.length > 0) p = p.filter(d => tagsAll.value.every(t => (d.tags ?? []).includes(t)))
  return p
}


function roll() {
  if (isShuffling.value) return
  error.value = null
  const p = pool()
  if (p.length === 0) {
    display.value = null
    result.value = null
    error.value = 'Keine passenden Drills. Filter anpassen oder neue Drills anlegen.'
    return
  }
  isShuffling.value = true
  let elapsed = 0
  display.value = p[Math.floor(Math.random() * p.length)]
  stopTimer()
  timer = window.setInterval(() => {
    elapsed += TICK_MS
    const currentPool = pool()
    if (currentPool.length === 0) {
      stopTimer()
      isShuffling.value = false
      display.value = null
      result.value = null
      error.value = 'Keine passenden Drills. Filter anpassen oder neue Drills anlegen.'
      return
    }
    display.value = currentPool[Math.floor(Math.random() * currentPool.length)]
    if (elapsed >= DURATION_MS) {
      stopTimer()
      const finalPool = pool()
      result.value = finalPool[Math.floor(Math.random() * finalPool.length)]
      display.value = result.value
      isShuffling.value = false
    }
  }, TICK_MS) as unknown as number
}


function stopTimer() {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
}
</script>


<style scoped>
/* sanftes Pulsieren während Shuffle */
@keyframes pulse {
  from {
    opacity: .6;
    transform: scale(.998);
  }
  to {
    opacity: 1;
    transform: scale(1.002);
  }
}

.reel {
  animation: pulse .45s ease-in-out infinite alternate;
}
</style>