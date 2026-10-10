<template>
  <div class="seg" role="radiogroup" :aria-label="label" :aria-describedby="describedby">
    <button v-for="(o, i) in options" :key="String(o.value)" type="button" role="radio" class="seg-opt" :class="{ on: o.value === modelValue }"
      :aria-checked="o.value === modelValue" :tabindex="o.value === modelValue ? 0 : -1" :data-testid="`${testid}-${o.value}`"
      @click="emit('update:modelValue', o.value)" @keydown="onKey($event, i)">{{ o.label }}</button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import { nextTick } from 'vue'

const props = defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  label: string
  describedby?: string
  testid?: string
}>()
const emit = defineEmits<(e: 'update:modelValue', v: T) => void>()

// arrow keys move the selection like a native radio group
function onKey(e: KeyboardEvent, i: number) {
  const n = props.options.length
  const target = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
  if (target < 0) return
  e.preventDefault()
  emit('update:modelValue', props.options[target].value)
  void nextTick().then(() => (e.currentTarget as HTMLElement | null)?.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[target]?.focus())
}
</script>

<style scoped>
.seg {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.seg-opt {
  padding: 4px 12px;
  min-height: 34px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.seg-opt.on {
  background: var(--primary);
  color: var(--primary-ink);
}

.seg-opt:focus-visible {
  outline: 3px solid var(--ring, currentColor);
  outline-offset: 1px;
}
</style>
