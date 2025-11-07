<template>
    <div class="reel card p-3">
        <div class="reel-label">{{ label }}</div>

        <!-- Viewport: exakt eine Zeile hoch -->
        <div class="reel-viewport">
            <!-- Mittel-Markierung -->
            <div class="reel-marker" aria-hidden="true"></div>

            <!-- Liste -->
            <ul ref="listRef" class="reel-track">
                <li v-for="(it, i) in looped" :key="i" class="reel-item">{{ it }}</li>
            </ul>

            <!-- Fades + Glanz -->
            <div class="reel-fade top"></div>
            <div class="reel-fade bottom"></div>
            <div class="reel-shine" aria-hidden="true"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
    items: string[]
    label: string
    spinTrigger: number
    duration?: number | { min: number; max: number }
    targetValue?: string
}>()
const emit = defineEmits<{ (e: 'stopped', value: string): void }>()

const listRef = ref<HTMLUListElement | null>(null)

// Einheitliche Höhe per CSS-Var (Default 48px)
const rowH = 48
const repetitions = 10
const baseItems = computed(() => (props.items.length ? props.items : ['—']))
const looped = computed(() => Array.from({ length: repetitions }).flatMap(() => baseItems.value))

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

function pickDuration(): number {
    if (!props.duration) return 1800 + Math.random() * 400
    if (typeof props.duration === 'number') return props.duration
    const { min, max } = props.duration
    return min + Math.random() * Math.max(0, max - min)
}

async function spin() {
    const el = listRef.value
    const items = baseItems.value
    if (!el || !items.length) return

    // Reset
    el.style.transition = 'none'
    el.style.transform = 'translateY(0px)'
    await nextTick()

    const totalRows = looped.value.length
    const totalH = totalRows * rowH

    // Ziel im mittleren Block → verhindert harte Sprünge am Rand
    const base = Math.floor(totalRows * 0.5)
    const targetIdxInItems = props.targetValue ? items.indexOf(props.targetValue) : -1
    const offsetWithin = targetIdxInItems >= 0 ? targetIdxInItems : Math.floor(Math.random() * Math.max(1, items.length))
    const targetIndex = base + offsetWithin
    const targetY = -(targetIndex * rowH)

    const duration = pickDuration()

    const start = performance.now()
    const startY = 0

    const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = easeOutCubic(t)
        // zusätzliche “Inertia”: 2-4 volle Umdrehungen
        const inertia = (rowH * items.length) * (2 + Math.floor(Math.random() * 3))
        const y = startY + eased * (targetY - startY - inertia)
        el.style.transform = `translateY(${y % -totalH}px)`
        if (t < 1) requestAnimationFrame(frame)
        else {
            const snapY = Math.round((y % -totalH) / rowH) * rowH
            const rawIndex = Math.abs(snapY / rowH) % (items.length || 1)
            const finalIndex = targetIdxInItems >= 0 ? targetIdxInItems : rawIndex
            const normalizedY = -(finalIndex * rowH)
            el.style.transform = `translateY(${normalizedY}px)`
            const value = (items[finalIndex] ?? '—')
            emit('stopped', value)
        }
    }
    requestAnimationFrame(frame)
}

watch(() => props.spinTrigger, () => { spin() })
</script>

<style scoped>
.reel-label {
    @apply text-xs font-semibold text-zinc-500 mb-2;
}

/* Ein-Zeilen-Viewport (48px) + Rahmen/Bevel */
.reel-viewport {
    --row: 48px;
    position: relative;
    height: var(--row);
    overflow: hidden;
    border-radius: 14px;
    /* Use theme-aware surface/background variables for light/dark support */
    background: linear-gradient(180deg, color-mix(in oklab, var(--surface) 85%, var(--bg) 15%), var(--surface));
    border: 1px solid var(--border);
    box-shadow:
        inset 0 1px 0 color-mix(in oklab, rgba(255,255,255,0.12) 35%, transparent),
        inset 0 -6px 14px color-mix(in oklab, rgba(0,0,0,0.06) 20%, transparent),
        0 10px 26px color-mix(in oklab, var(--bg) 6%, transparent);
}

/* Marker exakt in der Mitte (passt zu 48px) */
.reel-marker {
    position: absolute;
    inset-inline: 8px;
    top: 50%;
    height: 0;
    /* theme-aware primary marker */
    border-top: 2px solid color-mix(in oklab, var(--primary) 55%, transparent);
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent);
    transform: translateY(-50%);
    pointer-events: none;
}

.reel-track {
    will-change: transform;
}

.reel-item {
    height: var(--row);
    line-height: var(--row);
    font-size: 1.06rem;
    font-weight: 600;
    text-align: center;
    color: var(--text, #444C56);
    padding: 0 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* sanfter Fade oben/unten */
.reel-fade {
    position: absolute;
    left: 0;
    right: 0;
    height: 18px;
    pointer-events: none;
    /* Fade from the card surface into transparency; adapts to dark/light via --surface */
    background: linear-gradient(180deg, var(--surface), rgba(255,255,255,0));
}

.reel-fade.top {
    top: 0;
}

.reel-fade.bottom {
    bottom: 0;
    transform: rotate(180deg);
}

/* dezenter “Glanz”-Sweep */
.reel-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--surface) 70%, rgba(255,255,255,0.45)) 50%, transparent 100%);
    mix-blend-mode: screen;
    opacity: .0;
    animation: shine 2.6s linear infinite;
    pointer-events: none;
}

@keyframes shine {
    0% {
        opacity: 0;
        transform: translateX(-120%);
    }

    40% {
        opacity: .35;
    }

    100% {
        opacity: 0;
        transform: translateX(120%);
    }
}

.reel:hover {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, .02), 0 8px 24px rgba(0, 0, 0, .08);
}
</style>
