<!-- DrillSchema.vue -->
<template>
  <div class="schema" role="img" aria-label="Schematische Darstellung des Drills">
    <div v-if="svg" class="schema-diagram" v-html="svg"></div>
    <div v-else class="schema-fallback">Schema wird geladen…</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({ diagram: String });
const svg = ref("");

const src = computed(() =>
  props.diagram?.startsWith("svg:")
    ? `/${props.diagram.split(":")[1]}.svg` // <- kein /public hier!
    : null
);

async function load() {
  svg.value = "";
  if (!src.value) return;
  try {
    const res = await fetch(src.value, { cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Sicherheit: nur SVG zulassen
    if (!text.trim().startsWith("<svg")) throw new Error("Kein SVG");
    svg.value = text;
  } catch (e) {
    svg.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160">
      <style>
        text{font:500 14px ui-sans-serif,system-ui; fill: var(--muted);}
        rect{fill: color-mix(in oklab, var(--bg) 70%, var(--surface)); stroke: var(--border);}
      </style>
      <rect x="8" y="8" width="584" height="144" rx="12" ry="12"/>
      <text x="24" y="92">Schema konnte nicht geladen werden.</text>
    </svg>`;
    console.error("SVG laden fehlgeschlagen:", e);
  }
}

onMounted(load);
watch(src, load);
</script>

<style scoped>
.schema {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}

.schema-diagram :where(svg) {
  display: block;
  width: 100%;
  max-width: 680px;
  height: auto;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.schema-fallback {
  width: 100%;
  height: 220px;
  border-radius: 14px;
  background: color-mix(in oklab, var(--bg) 70%, var(--surface));
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  color: var(--muted);
}
</style>
