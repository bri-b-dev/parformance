<template>
  <DialogShell v-if="visible" variant="center" layer="alert" labelledby="confirm-title" describedby="confirm-message" :initial-focus="initialFocus"
    backdrop-testid="confirm-backdrop" class="confirm" @close="resolveModal(false)">
    <h2 id="confirm-title" :class="options.title ? 'confirm-title' : 'sr-only'">{{ options.title || 'Bestätigung' }}</h2>
    <p id="confirm-message" class="message" data-testid="confirm-message">{{ message }}</p>
    <ul v-if="options.details?.length" class="details" data-testid="confirm-details">
      <li v-for="d in options.details" :key="d">{{ d }}</li>
    </ul>

    <div v-if="options.secondary" class="secondary">
      <button type="button" class="btn" :disabled="secondaryBusy || secondaryDone" data-testid="confirm-secondary" @click="runSecondary">
        {{ secondaryDone ? (options.secondary.doneLabel ?? 'Erledigt') : options.secondary.label }}
      </button>
    </div>

    <template v-if="options.phrase">
      <label class="phrase-label" for="confirm-phrase">Tippe <strong>{{ options.phrase }}</strong> zur Bestätigung</label>
      <input id="confirm-phrase" v-model="typed" class="input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" data-testid="confirm-phrase" @keydown.enter.prevent="confirmIfReady" />
    </template>

    <div class="actions">
      <button class="btn" type="button" data-testid="confirm-cancel" @click="resolveModal(false)">Abbrechen</button>
      <button class="btn" :class="options.danger ? 'btn-danger' : 'btn-primary'" type="button" :disabled="!ready" data-testid="confirm-ok" @click="resolveModal(true)">{{ options.confirmLabel ?? 'OK' }}</button>
    </div>
  </DialogShell>
</template>

<script setup lang="ts">
import DialogShell from '@/components/DialogShell.vue'
import { setConfirmHandler, type ConfirmOptions } from '@/utils/confirmService'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const visible = ref(false)
const message = ref('')
const options = ref<ConfirmOptions>({})
const typed = ref('')
const secondaryBusy = ref(false)
const secondaryDone = ref(false)
let pendingResolve: ((v: boolean) => void) | null = null

const norm = (s: string) => s.trim().toLocaleUpperCase('de')
const ready = computed(() => !options.value.phrase || norm(typed.value) === norm(options.value.phrase))
// a destructive or typed confirmation starts on the safe choice
const initialFocus = computed(() => (options.value.phrase ? '#confirm-phrase' : '[data-testid="confirm-cancel"]'))

function showModal(msg: string, opts: ConfirmOptions = {}): Promise<boolean> {
  message.value = msg
  options.value = opts
  typed.value = ''
  secondaryBusy.value = false
  secondaryDone.value = false
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

function confirmIfReady() {
  if (ready.value) resolveModal(true)
}

async function runSecondary() {
  const run = options.value.secondary?.run
  if (!run) return
  secondaryBusy.value = true
  try {
    secondaryDone.value = (await run()) !== false
  } finally {
    secondaryBusy.value = false
  }
}

onMounted(() => {
  // register service handler
  setConfirmHandler((msg, opts) => showModal(msg, opts))
})

onBeforeUnmount(() => {
  setConfirmHandler(null)
})
</script>

<style scoped>
.confirm {
  --dlg-width: 400px;
}

.confirm-title {
  margin: 0 0 var(--space-2);
  font-size: 1.15rem;
  font-weight: 800;
}

.message {
  margin: 0 0 var(--space-3);
}

.details {
  margin: 0 0 var(--space-3);
  padding-left: 1.2rem;
  color: var(--muted);
  font-size: var(--font-size-sm);
}

.secondary {
  margin-bottom: var(--space-3);
}

.phrase-label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-3);
}
</style>
