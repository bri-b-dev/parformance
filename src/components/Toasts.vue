<template>
  <div class="toasts" aria-live="polite">
    <div v-for="t in items" :key="t.id" :class="['toast', t.type]">{{ t.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

type ToastItem = { id: string; type: 'success' | 'error' | 'info'; message: string }

const items = ref<ToastItem[]>([])

function addToast(detail: any) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
  const type = detail?.type || 'info'
  const message = String(detail?.message ?? '')
  const t: ToastItem = { id, type, message }
  items.value.push(t)
  // auto remove after 3s
  setTimeout(() => { items.value = items.value.filter(i => i.id !== id) }, 3000)
}

function onToast(e: any) { addToast(e.detail || e) }

onMounted(() => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('toast', onToast as EventListener)
  }
})

onBeforeUnmount(() => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.removeEventListener === 'function') {
    globalThis.removeEventListener('toast', onToast as EventListener)
  }
})
</script>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}
.toast {
  padding: 8px 12px;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>
