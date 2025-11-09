<template>
    <header
        class="sticky top-0 z-30 bg-app-bg/80 backdrop-blur supports-[backdrop-filter]:bg-app-bg/60 border-b border-zinc-200">
        <div class="max-w-6xl mx-auto pt-4 px-4 h-18 flex items-center justify-between">
            <div class="flex items-center gap-3 select-none">
                <div class="brand" aria-label="ParFormance">
                    <img src="/logo-header.svg" alt="ParFormance" class="logo" />
                    <div style="display:flex; flex-direction:column; min-width:0">
                        <span>ParFormance</span>
                        <small class="tagline" style="display:block;">Train smarter - play better</small>
                    </div>
                </div>

            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn" @click="toggle()"
                    :aria-label="theme === 'dark' ? 'Switch to light' : 'Switch to dark'">
                    <span v-if="theme === 'dark'">🌙</span>
                    <span v-else>☀️</span>
                </button>

                <button class="btn" type="button" aria-label="Einstellungen" @click="$emit('open-settings')">
                    ⚙️
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { useSettingsStore } from '@/stores/settings'

const { theme } = useTheme();
const settingsStore = useSettingsStore()

const toggle = async () => {
    const next = theme.value === 'light' ? 'dark' : 'light'
    await settingsStore.update({ theme: next })
}

defineEmits<{ (e: 'open-settings'): void }>()

</script>

<style scoped>
/* Using Iconify or a similar system for icons. Replace with your icon lib. */
.i-lucide-shuffle::before {
    content: '🔀';
}

.i-lucide-settings::before {
    content: '⚙️';
}
</style>
