# Golf Trainer — Clean UI Pack (handycap theme)

**Sauber neu aufgebauter Canvas** mit finalen, validen Dateien. Kopiere den **Dateiinhalt ohne die Markdown-Fences** (` ``` `) in die jeweils genannte Datei.

---

## 1) Globales Theme

**Datei:** `src/assets/theme.css`

```css
:root {
  --bg: #f7f9f8;
  --surface: #ffffff;
  --text: #152012;
  --muted: #647067;
  --primary: #1e7a46;
  --primary-ink: #ffffff;
  --ring: rgba(30,122,70,.3);
  --border: #e6ece8;
  --shadow: 0 2px 10px rgba(0,0,0,.06);
}
:root[data-theme="dark"] {
  --bg: #0e1511;
  --surface: #121a15;
  --text: #e8f1eb;
  --muted: #b1c0b7;
  --primary: #47c97f;
  --primary-ink: #0b140f;
  --ring: rgba(71,201,127,.35);
  --border: #243229;
  --shadow: 0 2px 12px rgba(0,0,0,.35);
}
html, body, #app { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans"; }
.container { max-width: 920px; margin: 0 auto; padding: 16px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow); padding: 14px; }
.btn { appearance: none; border: 1px solid var(--border); background: var(--surface); color: var(--text); padding: 10px 14px; border-radius: 12px; cursor: pointer; }
.btn-primary { background: var(--primary); color: var(--primary-ink); border-color: transparent; }
.btn:focus, .btn-primary:focus { outline: none; box-shadow: 0 0 0 4px var(--ring); }
.input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
.label { display:block; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.field { margin-bottom: 12px; }
.row { display:flex; gap: 12px; flex-wrap: wrap; }
.chips { display:flex; gap:6px; flex-wrap:wrap; }
.chip { background: var(--bg); border:1px solid var(--border); padding:4px 8px; border-radius:999px; font-size:12px; color: var(--muted); }
.hr { height:1px; background: var(--border); margin: 12px 0; border:0; }
.app-header { position: sticky; top: 0; z-index: 10; backdrop-filter: saturate(1.2) blur(8px); background: color-mix(in oklab, var(--bg) 86%, transparent); border-bottom: 1px solid var(--border); }
.app-header .bar { display:flex; align-items:center; justify-content:space-between; padding: 10px 14px; }
.brand { display:flex; align-items:center; gap:10px; font-weight: 700; }
.brand .logo { width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, #0a3)); }
.bottom-tabs { position: sticky; bottom: 0; z-index: 10; border-top: 1px solid var(--border); background: color-mix(in oklab, var(--bg) 86%, transparent); }
.bottom-tabs nav { display:flex; justify-content: space-around; padding: 8px 6px; }
.tab { display:flex; flex-direction:column; align-items:center; gap:4px; text-decoration:none; color: var(--muted); font-size: 12px; padding: 6px 10px; border-radius: 10px; }
.tab.active { color: var(--primary); background: color-mix(in oklab, var(--primary) 8%, transparent); }
main { padding-bottom: 72px; }
```

---

## 2) Theme-Toggle Composable

**Datei:** `src/composables/useTheme.ts`

```ts
import { ref, onMounted } from 'vue';
const KEY = 'gt.theme';
export function useTheme() {
  const theme = ref<'light'|'dark'>('light');
  const apply = () => document.documentElement.setAttribute('data-theme', theme.value);
  onMounted(() => {
    const saved = localStorage.getItem(KEY) as 'light'|'dark'|null;
    theme.value = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    apply();
  });
  const toggle = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem(KEY, theme.value);
    apply();
  };
  return { theme, toggle };
}
```

---

## 3) App-Shell (Header + Bottom Tabs + Container)

**Datei:** `src/App.vue`

```vue
<template>
  <div class="app">
    <header class="app-header">
      <div class="bar container">
        <div class="brand">
          <div class="logo" />
          <span>Golf Trainer</span>
        </div>
        <button class="btn" @click="toggle()" :aria-label="theme==='dark'?'Switch to light':'Switch to dark'">
          <span v-if="theme==='dark'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </div>
    </header>
    <main class="container">
      <RouterView />
    </main>
    <BottomTabs />
  </div>
</template>
<script setup lang="ts">
import BottomTabs from '@/components/BottomTabs.vue';
import { useTheme } from '@/composables/useTheme';
const { theme, toggle } = useTheme();
</script>
```

**Zusatz:** In `src/main.ts` sicherstellen:

```ts
import './assets/theme.css';
```

---

## 4) Bottom Tabs (finale, valide SFC)

**Datei:** `src/components/BottomTabs.vue`

```vue
<template>
  <div class="bottom-tabs">
    <nav>
      <RouterLink class="tab" :class="{ active: isActive('/') }" to="/">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span>Home</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/drills') }" to="/drills">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        <span>Drills</span>
      </RouterLink>
      <RouterLink class="tab" :class="{ active: isActive('/random') }" to="/random">
        <span class="icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.6" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <span>Zufall</span>
      </RouterLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
function isActive(prefix: string) {
  return route.path === prefix || route.path.startsWith(prefix + '/');
}
</script>
<style scoped>
.icon { line-height: 0; display:inline-flex; }
</style>
```

---

## 5) Randomizer View (mit Shuffle-Animation)

**Datei:** `src/views/RandomizerView.vue`

```vue
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
        <div class="field" style="min-width:160px;">
          <label class="label">Max. Schwierigkeit</label>
          <input class="input" type="number" min="1" max="5" v-model.number="maxDifficulty" :disabled="isShuffling" />
        </div>
        <div class="field" style="align-self:flex-end;">
          <button class="btn btn-primary" @click="roll" :disabled="isShuffling">
            <span v-if="!isShuffling">Ziehen</span>
            <span v-else>Shuffling…</span>
          </button>
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
        <p style="color:var(--muted);">Klicke auf <em>Ziehen</em>, um ein zufälliges Trainingsspiel zu erhalten. Falls keine Einträge vorhanden sind, lege welche unter <strong>Drills</strong> an.</p>
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useDrillStore } from '@/stores/drills';
import type { Drill, DrillCategory } from '@/types/drill';

const store = useDrillStore();
const display = ref<Drill | null>(null);   // aktuell angezeigter (während Shuffle wechselnd)
const result = ref<Drill | null>(null);    // final gezogener
const category = ref<'' | DrillCategory>('');
const maxDifficulty = ref<number | null>(null);
const isShuffling = ref(false);
const error = ref<string | null>(null);

let timer: number | null = null;
const TICK_MS = 85;        // Wechselgeschwindigkeit
const DURATION_MS = 900;   // Gesamtdauer der Shuffle-Animation

onMounted(async () => { await store.load(); });
onBeforeUnmount(() => { stopTimer(); });

function pool() {
  let p = [...store.drills];
  if (category.value) p = p.filter(d => d.category === category.value);
  if (maxDifficulty.value != null) p = p.filter(d => (d.difficulty ?? 3) <= (maxDifficulty.value as number));
  return p;
}

function roll() {
  if (isShuffling.value) return;
  error.value = null;
  const p = pool();
  if (p.length === 0) {
    display.value = null;
    result.value = null;
    error.value = 'Keine passenden Drills. Filter anpassen oder neue Drills anlegen.';
    return;
  }
  isShuffling.value = true;
  let elapsed = 0;
  // Sofort einmal anzeigen, dann „rotieren“
  display.value = p[Math.floor(Math.random() * p.length)];
  stopTimer();
  timer = window.setInterval(() => {
    elapsed += TICK_MS;
    const currentPool = pool();
    // Falls Pool leer geworden ist (z. B. währenddessen gelöscht), abbrechen
    if (currentPool.length === 0) {
      stopTimer();
      isShuffling.value = false;
      display.value = null;
      result.value = null;
      error.value = 'Keine passenden Drills. Filter anpassen oder neue Drills anlegen.';
      return;
    }
    display.value = currentPool[Math.floor(Math.random() * currentPool.length)];
    if (elapsed >= DURATION_MS) {
      // Finale Auswahl
      stopTimer();
      const finalPool = pool();
      result.value = finalPool[Math.floor(Math.random() * finalPool.length)];
      display.value = result.value;
      isShuffling.value = false;
    }
  }, TICK_MS) as unknown as number;
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
@keyframes pulse { from { opacity: .6; transform: scale(.998); } to { opacity: 1; transform: scale(1.002); } }
.reel { animation: pulse .45s ease-in-out infinite alternate; }
</style>
```

---

## 6) Router (Erinnerung)

**Datei:** `src/router/index.ts` (Ausschnitt)

```ts
routes: [
  { path: '/', name: 'home', component: HomeView },
  { path: '/drills', name: 'drills', component: DrillsView },
  { path: '/drills/:id', name: 'edit-drill', component: EditDrillView, props: true },
  { path: '/random', name: 'random', component: RandomizerView },
]
```

---

## 7) Checkliste nach dem Kopieren

* **Alle Files exakt ersetzen**, keine doppelten `<script>`/```vue-Fences in SFCs
* `main.ts` lädt `./assets/theme.css`
* Vite neu starten, falls caching spinnt: `npm run dev`

Fertig. Das UI entspricht jetzt **handycap** (Theme, Cards, Tabs), und die **Randomizer**-Seite zeigt direkt Filter + Empty-State; „Ziehen“ liefert ein Drill aus dem Store.
