<template>
  <dialog v-if="visible" class="confirm-overlay">
    <div class="confirm-box">
      <p class="message">{{ message }}</p>
      <div class="actions">
        <button class="btn" @click="__resolveModal(false)">Abbrechen</button>
        <button class="btn btn-primary" @click="__resolveModal(true)">OK</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { setConfirmHandler } from '@/utils/confirmService'

const visible = ref(false)
const message = ref('')
let pendingResolve: ((v: boolean) => void) | null = null

function showModal(msg: string): Promise<boolean> {
  message.value = msg
  visible.value = true
  return new Promise((resolve) => {
    pendingResolve = resolve
  })
}

function resolveModal(value: boolean) {
  visible.value = false
  if (pendingResolve) {
    try { pendingResolve(value) } catch {}
  }
  pendingResolve = null
}

// expose resolveModal so template can call it
const __resolveModal = resolveModal

onMounted(() => {
  // register service handler
  setConfirmHandler(async (msg: string) => {
    return await showModal(msg)
  })
})

onBeforeUnmount(() => {
  setConfirmHandler(null)
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.35); z-index: 10000;
}
.confirm-box { background: white; padding: 16px; border-radius: 8px; min-width: 280px; box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
.confirm-box .message { margin: 0 0 12px 0 }
.confirm-box .actions { display:flex; gap:8px; justify-content:flex-end }
</style>
