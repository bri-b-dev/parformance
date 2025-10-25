<template>
  <section class="card" style="max-width: 720px;">
    <header style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <div>
        <h2 style="margin:0; font-size:1.25rem; font-weight:700;">{{ drill.title }}</h2>
        <p style="color:var(--muted); margin:.25rem 0 0">{{ drill.category }}</p>
      </div>
      <!-- Favorite toggle -->
      <button
        type="button"
        class="btn"
        :aria-pressed="isFav"
        :aria-label="isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'"
        @click="toggleFavorite"
        title="Favorit"
      >
        <span aria-hidden="true">{{ isFav ? '★' : '☆' }}</span>
      </button>
    </header>

    <!-- Equipment -->
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

    <!-- Setup -->
    <div class="row" style="margin-top:8px; align-items:flex-start;">
      <div style="flex:2; min-width:220px;">
        <h3 class="label" style="margin-bottom:4px;">Setup</h3>
        <p style="margin:0;">{{ drill.setup.schema }}</p>
        <p v-if="drill.setup.location" style="margin:.25rem 0 0; color:var(--muted)"><strong>Ort:</strong> {{ drill.setup.location }}</p>
      </div>
      <div style="flex:1; min-width:160px;">
        <div class="border border-dashed rounded-md" style="border-color:var(--border); background:var(--bg); height:92px; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:12px;">
          Diagramm
        </div>
      </div>
    </div>

    <!-- Duration / Difficulty -->
    <div class="row" style="margin-top:8px;">
      <div class="chip" title="Empfohlene Dauer" v-if="drill.duration?.suggestedMin">⏱️ {{ drill.duration.suggestedMin }} min</div>
      <div class="chip" title="Timer" v-if="drill.duration?.timerPreset">▶ {{ Math.round(drill.duration.timerPreset / 60) }} min Timer</div>
      <div class="chip" title="Schwierigkeit" v-if="(drill as any).difficulty?.base">★ {{ (drill as any).difficulty.base }}/5</div>
    </div>

    <!-- Procedure -->
    <div style="margin-top:10px;">
      <h3 class="label" style="margin-bottom:4px;">Ablauf</h3>
      <p style="margin:0;">{{ drill.instructions.training }}</p>
      <p v-if="drill.instructions.test" style="margin:.25rem 0 0; color:var(--muted)"><strong>Test:</strong> {{ drill.instructions.test }}</p>
      <p v-if="drill.instructions.tooEasy" style="margin:.25rem 0 0; color:var(--muted)"><strong>Zu leicht?</strong> {{ drill.instructions.tooEasy }}</p>
    </div>

    <div v-if="drill.tags?.length" class="chips" style="margin-top:8px;">
      <span class="chip" v-for="t in drill.tags" :key="t">{{ t }}</span>
    </div>

    <hr class="hr" />

    <!-- Metric -->
    <div>
      <strong>Metrik:</strong> <span>{{ drill.metric.type }}</span>
      <span class="chip" aria-label="Einheit">Einheit: {{ drill.metric.unit }}</span>
    </div>

    <!-- HCP Targets -->
    <HcpTargetsTable :drill="drill" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Drill } from '@/types'
import { useFavoritesStore } from '@/stores/favorites'
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'

const props = defineProps<{ drill: Drill }>()

const favorites = useFavoritesStore()

onMounted(() => { if (!favorites.loaded) favorites.load() })

const isFav = computed(() => favorites.isFavorite(props.drill.id))

async function toggleFavorite() {
  await favorites.toggle(props.drill.id)
}
</script>
