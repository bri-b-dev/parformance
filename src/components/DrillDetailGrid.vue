<template>
    <div class="detail-grid" role="group" aria-label="Drill Details">
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
            <h3>Ort</h3>
            <p class="muted">{{ drill.setup.location }}</p>
            <h3>Aufbau</h3>
            <p class="muted">{{ drill.setup.schema }}</p>
            <h3>Schematische Darstellung</h3>
            <div class="schema">
                <canvas width="20%" height="200" aria-label="Schematische Darstellung des Drills"></canvas>
            </div>

            <div class="hr" style="margin:10px 0;"></div>
            <h3>Ablauf</h3>
            <p>{{ drill.instructions?.training }}</p>
            <div style="margin-top:10px;">
                <p v-if="drill.instructions.test" style="margin:.25rem 0 0; color:var(--muted)"><strong>Ablauf</strong>
                    {{
                        drill.instructions.test }}</p>
                <p v-if="drill.instructions.tooEasy" style="margin:.25rem 0 0; color:var(--muted)">
                    <strong>Zu leicht?</strong> {{ drill.instructions.tooEasy }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Drill } from '@/types'

const props = defineProps<{ drill: Drill }>()
</script>
