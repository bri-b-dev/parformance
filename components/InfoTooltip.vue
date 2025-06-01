<template>
  <span
    class="info-wrapper"
    tabindex="0"
    role="button"
    aria-label="Info"
  >
    <span class="info-icon">ℹ️</span>
    <div class="tooltip">{{ text }}</div>
  </span>
</template>

<script setup>
const props = defineProps({
  /** Text, der im Tooltip angezeigt werden soll */
  text: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.info-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  outline: none;
}

/* Icon ℹ️ */
.info-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Tooltip‐Box, initial unsichtbar */
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
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Pfeil unter dem Tooltip */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%; /* direkt unterhalb der Tooltip‐Box */
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: var(--text) transparent transparent transparent;
}

/* Tooltip einblenden bei Hover oder Fokus */
.info-wrapper:hover .tooltip,
.info-wrapper:focus .tooltip,
.info-wrapper:focus-within .tooltip {
  opacity: 1;
  pointer-events: auto;
}
</style>
