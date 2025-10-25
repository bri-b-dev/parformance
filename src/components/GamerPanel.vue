<template>
  <section class="gamer-panel" :aria-hidden="collapsed" ref="container">
    <header class="panel-header">
      <button
        class="panel-toggle"
        :aria-expanded="!collapsed"
        @click="toggle"
        @keydown.space.prevent="toggle"
        @keydown.enter.prevent="toggle"
        ref="toggleBtn"
      >
        {{ collapsed ? 'Gamer ▼' : 'Gamer ▲' }}
      </button>
    </header>

    <div v-if="!collapsed" class="panel-body" role="dialog" aria-modal="true">
      <label>
        Mode
        <select v-model="local.mode" data-testid="gamer-mode">
          <option value="">(none)</option>
          <option value="practice">Practice</option>
          <option value="competition">Competition</option>
          <option value="game">Game</option>
        </select>
      </label>

      <label>
        Handicap offset
        <input data-testid="gamer-offset" type="number" v-model.number="local.handicapOffset" />
      </label>

      <div class="panel-actions">
        <button class="btn" @click="save" data-testid="gamer-save">Save</button>
        <button class="btn" @click="close" data-testid="gamer-close">Close</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useGamerSettingsStore } from '@/stores/gamerSettings'

const props = defineProps<{ drillId: string }>()
const store = useGamerSettingsStore()

const collapsed = ref(true)
const local = ref({ mode: undefined as string | undefined, handicapOffset: 0 })

function load() {
  const s = store.forDrill(props.drillId)
  collapsed.value = s.collapsed ?? true
  local.value = { mode: s.mode, handicapOffset: s.handicapOffset ?? 0 }
}

onMounted(async () => {
  if (!store.loaded) await store.load()
  load()
})

watch(() => props.drillId, () => load())

async function toggle() {
  collapsed.value = !collapsed.value
  await store.setCollapsed(props.drillId, collapsed.value)
  if (!collapsed.value) nextTick(() => trapFocus())
}

function close() {
  collapsed.value = true
  store.setCollapsed(props.drillId, true)
}

function save() {
  store.setMode(props.drillId, local.value.mode)
  store.setHandicapOffset(props.drillId, local.value.handicapOffset)
}

// Basic focus trap implementation for a11y when panel is open
let cleanupTrap: (() => void) | null = null
function trapFocus() {
  const container = (document.querySelector('.gamer-panel') as HTMLElement) || null
  if (!container) return
  const focusable = Array.from(container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'))
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  first.focus()

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  cleanupTrap = () => {
    document.removeEventListener('keydown', onKey)
  }
  document.addEventListener('keydown', onKey)
}

onBeforeUnmount(() => { if (cleanupTrap) cleanupTrap() })

</script>

<style scoped>
.gamer-panel { border: 1px solid var(--gray-200, #e5e7eb); padding: 8px; border-radius: 6px; max-width: 360px }
.panel-header { display:flex; justify-content:space-between; align-items:center }
.panel-toggle { background:transparent; border:none; font-weight:700; cursor:pointer }
.panel-body { margin-top:8px; display:flex; flex-direction:column; gap:8px }
.panel-actions { display:flex; gap:8px; margin-top:8px }
label { display:flex; flex-direction:column; font-size:0.9rem }
</style>
