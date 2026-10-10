<template>
    <header ref="bar"
        class="sticky top-0 z-30 bg-app-bg/80 backdrop-blur supports-[backdrop-filter]:bg-app-bg/60 border-b border-zinc-200">
        <div class="max-w-6xl mx-auto pt-2 px-4 h-18 flex items-center justify-between header-inner">
            <div class="flex items-center gap-3 select-none">
                <div class="brand" aria-label="ParFormance">
                    <BrandMark class="header-mark" />
                    <div style="display:flex; flex-direction:column; min-width:0">
                        <span>ParFormance</span>
                        <small class="tagline" style="display:block;">Train smarter - play better</small>
                    </div>
                </div>

            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn min-h-[44px] min-w-[44px] flex items-center justify-center p-0" type="button"
                    aria-label="Einstellungen" @click="$emit('open-settings')">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import BrandMark from '@/components/BrandMark.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Publish the header height so sticky bars inside screens can sit right below it.
const bar = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function publish() {
    if (bar.value) document.documentElement.style.setProperty('--app-header-h', `${bar.value.offsetHeight}px`)
}

onMounted(() => {
    publish()
    if (typeof ResizeObserver !== 'undefined' && bar.value) {
        observer = new ResizeObserver(publish)
        observer.observe(bar.value)
    }
})

onBeforeUnmount(() => observer?.disconnect())

defineEmits<(e: 'open-settings') => void>()

</script>

<style scoped>
/* Using Iconify or a similar system for icons. Replace with your icon lib. */
.i-lucide-shuffle::before {
    content: '🔀';
}

.i-lucide-settings::before {
    content: '⚙️';
}

.header-mark {
    height: 36px;
    width: auto;
    flex: none;
}

.header-inner {
    padding-top: 8px;
}
</style>
