<template>
    <fieldset class="detail-grid" aria-label="Drill Details">

        <div class="section">
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
            <strong class="muted">Schematische Darstellung</strong>
            <DrillSchema :diagram="drill.setup.diagram" />

            <template v-if="hasInstructions">
                <div class="hr" style="margin:10px 0;"></div>
                <div style="margin-top:10px;">
                    <template v-if="drill.instructions.test">
                        <strong class="muted">Ablauf</strong>
                        <p class="muted">{{ drill.instructions.test }}</p>
                    </template>
                    <template v-if="drill.instructions.tooEasy">
                        <strong class="muted">Zu leicht?</strong>
                        <p class="muted">{{ drill.instructions.tooEasy }}</p>
                    </template>
                </div>
            </template>
        </div>
    </fieldset>
</template>

<script setup lang="ts">
import DrillSchema from '@/components/DrillSchema.vue';
import type { Drill } from '@/types';
import { computed } from 'vue';

const props = defineProps<{ drill: Drill }>()

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

const hasInstructions = computed(() => {
    const ins = props.drill.instructions as any
    return Boolean(ins && (ins.test || ins.tooEasy))
})

const locationLabel = computed(() => props.drill.setup?.location?.trim() || '—')
const schemaLabel = computed(() => props.drill.setup?.schema?.trim() || '—')
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

/* Ensure muted labels/paras inside this detail grid render at a consistent size */
.section .muted {
    font-size: 14px;
}
</style>
