<template>
  <DialogShell v-if="visible" variant="center" layer="alert" labelledby="confirm-title" describedby="confirm-message" initial-focus='[data-testid="confirm-cancel"]'
    backdrop-testid="confirm-backdrop" class="confirm" @close="resolveModal(false)">
    <h2 id="confirm-title" class="sr-only">Bestätigung</h2>
    <p id="confirm-message" class="message">{{ message }}</p>
    <div class="actions">
      <button class="btn" type="button" data-testid="confirm-cancel" @click="resolveModal(false)">Abbrechen</button>
      <button class="btn btn-primary" type="button" data-testid="confirm-ok" @click="resolveModal(true)">OK</button>
    </div>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import { setConfirmHandler } from '@/utils/confirmService'
import { onBeforeUnmount, onMounted, ref } from 'vue'

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
  pendingResolve?.(value)
  pendingResolve = null
}

onMounted(() => {
  // register service handler
  setConfirmHandler((msg: string) => showModal(msg))
})

onBeforeUnmount(() => {
  setConfirmHandler(null)
})
</script>

<style scoped>
.confirm {
  --dlg-width: 360px;
}

.message {
  margin: 0 0 var(--space-3);
}

.actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
