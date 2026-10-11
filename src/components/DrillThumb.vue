<template>
  <div ref="root" class="thumb" aria-hidden="true" data-testid="drill-thumb">
    <div v-if="svg" class="thumb-svg" v-html="svg"></div>
    <div v-else class="thumb-ph"></div>
  </div>
</template>

<script setup lang="ts">
import { diagramUrl } from '@/filters/catalog'
import { scopeSvgIds } from '@/utils/svgIds'
import type { Drill } from '@/types'
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Small preview of a drill's diagram. The diagrams use the app's theme variables, so they are inlined
 * (an <img> would lose the colors). Loaded when the card scrolls into view and cached per URL.
 */
const props = defineProps<{ drill: Drill }>()

const cache = new Map<string, Promise<string | null>>()
let counter = 0
const prefix = `t${++counter}-${Math.random().toString(36).slice(2, 6)}`

const root = ref<HTMLElement | null>(null)
const svg = ref('')
let observer: IntersectionObserver | null = null

function fetchSvg(url: string): Promise<string | null> {
  if (!cache.has(url)) {
    cache.set(url, (async () => {
      try {
        const res = await fetch(new URL(url, location.href).href)
        if (!res.ok) return null
        const text = await res.text()
        // the dev server answers unknown paths with index.html
        return text.trim().startsWith('<svg') ? text : null
      } catch {
        return null
      }
    })())
  }
  return cache.get(url)!
}

async function load() {
  const url = diagramUrl(props.drill)
  if (!url) return
  const text = await fetchSvg(url)
  if (text) svg.value = scopeSvgIds(text, prefix)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !root.value) {
    void load()
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer?.disconnect()
      void load()
    }
  }, { rootMargin: '200px' })
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.thumb {
  flex: none;
  width: 96px;
  aspect-ratio: 720 / 420;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  overflow: hidden;
}

.thumb-svg,
.thumb-ph {
  width: 100%;
  height: 100%;
}

.thumb-svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
