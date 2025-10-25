<template>
  <section class="card" style="max-width: 720px;">
    <header>
      <h2 style="margin:0; font-size:1.25rem; font-weight:700;">{{ drill.title }}</h2>
      <p style="color:var(--muted); margin:.25rem 0 0">{{ drill.category }}</p>
    </header>

    <div class="row" style="margin-top:8px;">
      <div class="chip" title="Empfohlene Dauer" v-if="drill.duration?.suggestedMin">⏱️ {{ drill.duration.suggestedMin }} min</div>
      <div class="chip" title="Timer" v-if="drill.duration?.timerPreset">▶ {{ Math.round(drill.duration.timerPreset / 60) }} min Timer</div>
      <div class="chip" title="Schwierigkeit" v-if="(drill as any).difficulty?.base">★ {{ (drill as any).difficulty.base }}/5</div>
    </div>

    <div style="margin-top:10px;">
      <h3 class="label" style="margin-bottom:4px;">Anleitung</h3>
      <p style="margin:0;">{{ drill.instructions.training }}</p>
      <p v-if="drill.instructions.test" style="margin:.25rem 0 0; color:var(--muted)"><strong>Test:</strong> {{ drill.instructions.test }}</p>
      <p v-if="drill.instructions.tooEasy" style="margin:.25rem 0 0; color:var(--muted)"><strong>Zu leicht?</strong> {{ drill.instructions.tooEasy }}</p>
    </div>

    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span class="chip" v-for="t in drill.tags" :key="t">{{ t }}</span>
    </div>

    <hr class="hr" />

    <div>
      <strong>Metrik:</strong> <span>{{ drill.metric.type }}</span>
      <span class="chip">Einheit: {{ drill.metric.unit }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Drill } from '@/types'

const props = defineProps<{ drill: Drill }>()
</script>
