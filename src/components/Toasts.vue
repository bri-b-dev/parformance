<template>
  <div class="toasts" aria-live="polite">
    <div v-for="t in items" :key="t.id" :class="['toast', t.type]">
      <span>{{ t.message }}</span>
      <button v-if="t.actionLabel" type="button" class="toast-action" data-testid="toast-action" @click="runAction(t)">{{ t.actionLabel }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

type ToastItem = { id: string; type: 'success' | 'error' | 'info'; message: string; actionLabel?: string; onAction?: () => void }

const items = ref<ToastItem[]>([])

function addToast(detail: any) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
  const type = detail?.type || 'info'
  const message = String(detail?.message ?? '')
  const t: ToastItem = { id, type, message, actionLabel: detail?.actionLabel, onAction: detail?.onAction }
  items.value.push(t)
  // auto remove after 3s, or the given duration (e.g. 5s for an undo hint)
  const ms = typeof detail?.duration === 'number' ? detail.duration : 3000
  setTimeout(() => { items.value = items.value.filter(i => i.id !== id) }, ms)
}

function runAction(t: ToastItem) {
  items.value = items.value.filter(i => i.id !== t.id)
  t.onAction?.()
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
  z-index: var(--z-toast);
}
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.toast-action {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
  color: inherit;
  font-weight: 700;
  padding: 2px 10px;
  min-height: 32px;
  cursor: pointer;
}
</style>
