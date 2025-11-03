<template>
    <fieldset class="detail-grid" aria-label="Drill Details">

        <div class="section">
            <h3>Was du brauchst</h3>
            <div class="row" style="margin-top:8px;">
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
            <strong style="margin:.25rem 0 0; color:var(--muted)">Ort</strong>
            <p style="margin:.25rem 0 0; color:var(--muted)">{{ locationLabel }}</p>
            <strong style="margin:.25rem 0 0; color:var(--muted)">Aufbau</strong>
            <p style="margin:.25rem 0 0; color:var(--muted)">{{ schemaLabel }}</p>
            <strong style="margin:.25rem 0 0; color:var(--muted)">Schematische Darstellung</strong>
            <DrillSchema :diagram="drill.setup.diagram" />

            <div class="hr" style="margin:10px 0;"></div>
            <div style="margin-top:10px;">
                <p v-if="drill.instructions.test" style="margin:.25rem 0 0; color:var(--muted)"><strong>Ablauf</strong>
                    {{ drill.instructions.test }}</p>
                <p v-if="drill.instructions.tooEasy" style="margin:.25rem 0 0; color:var(--muted)">
                    <strong>Zu leicht?</strong> {{ drill.instructions.tooEasy }}
                </p>
            </div>
        </div>
    </fieldset>
</template>

<script setup lang="ts">
import DrillSchema from '@/components/DrillSchema.vue';
import type { Drill } from '@/types';
import { computed } from 'vue';

const props = defineProps<{ drill: Drill }>()

const clubsLabel = computed(() => {
    const clubs = props.drill.equipment?.clubs
    if (Array.isArray(clubs)) return clubs.join(', ')
    if (typeof clubs === 'string') return clubs.trim()
    return ''
})

const otherLabel = computed(() => {
    const other = props.drill.equipment?.other
    if (Array.isArray(other)) return other.join(', ')
    if (typeof other === 'string') return other.trim()
    return ''
})

const locationLabel = computed(() => props.drill.setup?.location?.trim() || '—')
const schemaLabel = computed(() => props.drill.setup?.schema?.trim() || '—')
</script>
