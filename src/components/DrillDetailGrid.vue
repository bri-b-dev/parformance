<template>
    <div class="detail-grid" role="group" :aria-label="label" :data-section="section">
        <!-- Aufbau: diagram first -->
        <div v-if="section === 'setup'" class="section">
            <DrillSchema :diagram="drill.setup.diagram" />

            <h3>Was du brauchst</h3>
            <div class="row details-row">
                <div v-if="drill.equipment?.balls != null" class="chip" title="Bälle">
                    🟢 × {{ drill.equipment.balls }}
                </div>
                <div v-if="clubsLabel" class="chip" title="Schläger">
                    ⛳️ {{ clubsLabel }}
                </div>
                <div v-if="otherLabel" class="chip" title="Sonstiges">
                    🧰 {{ otherLabel }}
                </div>
            </div>
            <div class="hr" style="margin:10px 0;"></div>
            <strong class="muted">Ort</strong>
            <p class="muted">{{ locationLabel }}</p>
            <strong class="muted">Aufbau</strong>
            <p class="muted">{{ schemaLabel }}</p>
        </div>

        <!-- Ablauf -->
        <div v-else-if="section === 'flow'" class="section">
            <template v-if="drill.instructions.training">
                <strong class="muted">Ablauf</strong>
                <p class="muted">{{ drill.instructions.training }}</p>
            </template>
            <template v-if="drill.instructions.test">
                <strong class="muted">Ergebnis</strong>
                <p class="muted">{{ drill.instructions.test }}</p>
            </template>
            <p v-if="!drill.instructions.training && !drill.instructions.test" class="muted">Keine Beschreibung vorhanden.</p>
        </div>

        <!-- Zu leicht? + Varianten -->
        <div v-else class="section">
            <template v-if="drill.instructions.tooEasy">
                <strong class="muted">Zu leicht?</strong>
                <p class="muted">{{ drill.instructions.tooEasy }}</p>
            </template>
            <template v-if="variants.length">
                <strong class="muted">Varianten</strong>
                <ul class="muted variants">
                    <li v-for="(v, i) in variants" :key="i">{{ v }}</li>
                </ul>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import DrillSchema from '@/components/DrillSchema.vue';
import type { Drill } from '@/types';
import { computed } from 'vue';

const props = withDefaults(defineProps<{ drill: Drill; section?: 'setup' | 'flow' | 'extra' }>(), { section: 'setup' })

const label = computed(() => ({ setup: 'Aufbau', flow: 'Ablauf', extra: 'Zu leicht und Varianten' }[props.section]))

const clubsLabel = computed(() => {
    const clubs = props.drill.equipment?.clubs as any
    if (Array.isArray(clubs)) return clubs.join(', ')
    if (typeof clubs === 'string') return clubs.trim()
    return ''
})

const otherLabel = computed(() => {
    const other = props.drill.equipment?.other as any
    if (Array.isArray(other)) return other.join(', ')
    if (typeof other === 'string') return other.trim()
    return ''
})

const variants = computed(() => (Array.isArray(props.drill.variants) ? props.drill.variants.filter(Boolean) : []))
const locationLabel = computed(() => props.drill.setup?.location?.trim() || '-')
const schemaLabel = computed(() => props.drill.setup?.schema?.trim() || '-')
</script>

<style scoped>
.detail-grid {
    width: 100%;
    min-inline-size: 0;
    box-sizing: border-box;
}

.section {
    width: 100%;
    box-sizing: border-box;
}

.details-row {
    flex-wrap: wrap;
    gap: 6px;
}

.variants {
    margin: 4px 0 0;
    padding-left: 20px;
}

/* Ensure muted labels/paras inside this detail grid render at a consistent size */
.section .muted {
    font-size: 14px;
}
</style>
