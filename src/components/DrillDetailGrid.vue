<template>
    <fieldset class="detail-grid" aria-label="Drill Details">

        <div class="section">
            <h3>Was du brauchst</h3>
            <div class="row" style="margin-top:8px;">
                <div v-if="drill.equipment?.balls != null" class="chip" title="Bälle">
                    🟢 × {{ drill.equipment.balls }}
                </div>
                <div v-if="(drill.equipment?.clubs?.length ?? 0) > 0" class="chip" title="Schläger">
                    ⛳️ {{ drill.equipment.clubs?.join(', ') }}
                </div>
                <div v-if="(drill.equipment?.other?.length ?? 0) > 0" class="chip" title="Sonstiges">
                    🧰 {{ drill.equipment.other?.join(', ') }}
                </div>
            </div>
            <div class="hr" style="margin:10px 0;"></div>
            <strong style="margin:.25rem 0 0; color:var(--muted)">Ort</strong>
            <p style="margin:.25rem 0 0; color:var(--muted)">{{ drill.setup.location }}</p>
            <strong style="margin:.25rem 0 0; color:var(--muted)">Aufbau</strong>
            <p style="margin:.25rem 0 0; color:var(--muted)">{{ drill.setup.schema }}</p>
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

const props = defineProps<{ drill: Drill }>()
</script>
