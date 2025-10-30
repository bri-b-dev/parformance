<template>
    <button class="shuffle-btn" aria-label="Zufalls-Drill" @click="openShuffle">
        <span class="icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Top-Marquee -->
                <rect x="5.5" y="3" width="9" height="3" rx="1.2" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" />
                <!-- Body -->
                <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" />
                <!-- Reels (Fenster) -->
                <rect x="5.8" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" />
                <rect x="9.4" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" />
                <rect x="13" y="9" width="3.2" height="4" rx="0.6" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round" />
                <!-- Simple "7"-Anmutung in jedem Fenster -->
                <path d="M6.2 10h2l-1.2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                    stroke-linejoin="round" />
                <path d="M9.8 10h2l-1.2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                    stroke-linejoin="round" />
                <path d="M13.4 10h2l-1.2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                    stroke-linejoin="round" />
                <!-- Hebel rechts -->
                <path d="M17 10.5l2.6-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                    stroke-linejoin="round" />
                <circle cx="20.6" cy="7.8" r="1.2" fill="currentColor" />
            </svg>
        </span>
    </button>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()

function openShuffle() {
    // Open as real overlay/modal using the UI store
    ui.setShuffle(true)
}
</script>

<style scoped>
.shuffle-btn {
    position: fixed;
    bottom: 92px;
    right: 20px;
    background: var(--primary);
    color: var(--primary-ink);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    border: 1px solid color-mix(in oklab, var(--primary) 40%, var(--border));
}
</style>
