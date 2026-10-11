<template>
  <div class="dlg" :class="[`dlg-${variant}`, `layer-${layer}`]" :data-testid="backdropTestid" @click.self="backdropClose && emit('close')">
    <div ref="panel" class="dlg-panel" :class="{ card: variant !== 'full' }" role="dialog" aria-modal="true" :aria-labelledby="labelledby"
      :aria-describedby="describedby" tabindex="-1" v-bind="$attrs">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useScrollLock } from '@/composables/useScrollLock'
import { ref } from 'vue'

/**
 * The one dialog: backdrop, role/aria, focus trap, Escape, focus return and scroll lock.
 * Variants: `center` (card), `bottom` (sheet), `side` (settings panel), `full` (live view).
 * Extra attributes (data-testid, class) land on the dialog panel itself.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  labelledby: string
  describedby?: string
  variant?: 'center' | 'bottom' | 'side' | 'full'
  /** Stacking: overlay < sheet < modal < alert. */
  layer?: 'overlay' | 'sheet' | 'modal' | 'alert'
  /** A click on the dimmed area closes the dialog. */
  backdropClose?: boolean
  /** Selector of the element to focus first. */
  initialFocus?: string
  /** Test hook for the backdrop element. */
  backdropTestid?: string
}>(), { describedby: undefined, variant: 'center', layer: 'sheet', backdropClose: true, initialFocus: undefined, backdropTestid: undefined })

const emit = defineEmits<(e: 'close') => void>()

const panel = ref<HTMLElement | null>(null)
const { focusInitial } = useFocusTrap(panel, { onEscape: () => emit('close'), initialFocus: props.initialFocus })
useScrollLock()

defineExpose({ focusInitial, panel })
</script>

<style scoped>
.dlg {
  position: fixed;
  inset: 0;
  display: flex;
  background: rgba(0, 0, 0, 0.55);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

.layer-overlay { z-index: var(--z-overlay); }
.layer-sheet { z-index: var(--z-sheet); }
.layer-modal { z-index: var(--z-modal); }
.layer-alert { z-index: var(--z-alert); }

.dlg-panel {
  box-sizing: border-box;
  margin: 0;
  max-width: 100%;
}

.dlg-panel:focus {
  outline: none;
}

/* centered card */
.dlg-center {
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.dlg-center .dlg-panel {
  width: min(var(--dlg-width, 560px), 100%);
  max-height: 92vh;
  overflow-y: auto;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

/* bottom sheet */
.dlg-bottom {
  align-items: flex-end;
  justify-content: center;
}

.dlg-bottom .dlg-panel {
  width: min(var(--dlg-width, 560px), 100%);
  max-height: 92vh;
  overflow-y: auto;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-4) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
}

/* side panel: the top inset keeps the header controls clear of a translucent status bar */
.dlg-side {
  justify-content: flex-end;
}

.dlg-side .dlg-panel {
  width: min(var(--dlg-width, 480px), 92vw);
  height: 100%;
  overflow-y: auto;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  padding: calc(var(--space-4) + env(safe-area-inset-top, 0px)) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
}

/* full screen */
.dlg-full {
  background: var(--bg);
}

.dlg-full .dlg-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
  color: var(--text);
  padding: calc(var(--space-4) + env(safe-area-inset-top, 0px)) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
}
</style>
