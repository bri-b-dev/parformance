<template>
  <div class="faq-card">
    <div class="faq-header" @click="toggle">
      <h3>{{ title }}</h3>
      <button class="toggle-button" aria-label="Toggle info">
        {{ open ? '–' : '+' }}
      </button>
    </div>
    <transition name="collapse">
      <div v-show="open" class="faq-content">
        <p v-html="text"></p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  /** Überschrift des FAQ-Items */
  title: {
    type: String,
    required: true
  },
  /** Text (HTML) des FAQ-Items */
  text: {
    type: String,
    required: true
  }
})

const open = ref(false)
function toggle() {
  open.value = !open.value
}
</script>

<style scoped>
.faq-card {
  margin-top: 1rem;
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border-bottom: 1px solid #ddd;
}

.toggle-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
  overflow: hidden;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.3s ease;
}

.faq-content {
  padding: 1rem;
}
</style>
