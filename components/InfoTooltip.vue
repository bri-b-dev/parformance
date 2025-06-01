<template>
  <span
    class="info-wrapper"
    @mouseenter="show = true"
    @mouseleave="show = false"
    @click="toggle"
    @blur="show = false"
    tabindex="0"
  >
    <!-- Icon oder whatever du als Trigger möchtest -->
    <span class="info-icon" aria-describedby="tooltip-{{ id }}"> ℹ️</span>

    <div
      v-if="show"
      class="tooltip"
      :id="'tooltip-' + id"
      role="tooltip"
    >
      {{ text }}
    </div>
  </span>
</template>

<script setup>
import { ref } from 'vue'

// Einfache Zufalls-ID, damit aria-describedby eindeutig ist
const id = Math.random().toString(36).substr(2, 9)

const props = defineProps({
  /** Text, der im Tooltip angezeigt werden soll */
  text: {
    type: String,
    required: true
  }
})

const show = ref(false)

function toggle() {
  show.value = !show.value
}
</script>

<style scoped>
/* Wrapper für relativen Bezugspunkt */
.info-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

/* Icon (ℹ️) kann hier weiter gestylt werden */
.info-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Tooltip selbst */
.tooltip {
  position: absolute;
  bottom: 125%; /* oberhalb des Icons */
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 30;
  /* Drop-Shadow */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Pfeil unter dem Tooltip */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%; /* unten am Tooltip */
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: var(--text) transparent transparent transparent;
}
</style>
