<!-- DrillSchema.vue -->
<template>
  <div class="schema">
    <div v-if="svg" class="schema-diagram" v-html="svg"></div>
    <div v-else class="schema-fallback">Schema wird geladen…</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({ diagram: String });
const svg = ref("");

const src = computed(() => {
  if (!props.diagram?.startsWith("svg:")) return null
  const part = props.diagram.split(":")[1] || ''
  // strip leading slashes and avoid double-adding .svg
  const clean = part.replace(/^\/+/, '')
  return `/${clean}${clean.toLowerCase().endsWith('.svg') ? '' : '.svg'}`
})

async function load() {
  svg.value = "";
  if (!src.value) return;
  try {
    const res = await fetch(new URL(src.value, location.href).href, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') || ''
    let text = await res.text()
    // Sicherheit: only accept true SVG responses (Vite will return index.html on unknown paths)
    if (ct.includes('text/html') || !text.trim().startsWith('<svg')) throw new Error('Kein SVG (received HTML or invalid content)')

    // Sanitize: some SVGs include global class rules like `.muted { ... }` which
    // accidentally leak into the document and override app styles. Namespace those
    // rules so they only apply inside the diagram container.
    if (text.includes('.muted')) {
      // handle both `.muted {` and `.muted{` variants
      text = text.replaceAll('.muted {', '.schema-diagram .muted{')
      text = text.replaceAll('.muted{', '.schema-diagram .muted{')
    }

    svg.value = text
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
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.schema-diagram :where(svg) {
  display: block;
  width: 100%;
  /* allow the SVG to fill the diagram container; the outer drill card already
     constrains the overall max-width (720px). Prevent a separate 680px cap
     that makes some diagrams appear narrower than the card. */
  max-width: 100%;
  height: auto;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.schema-diagram {
  width: 100%;
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
