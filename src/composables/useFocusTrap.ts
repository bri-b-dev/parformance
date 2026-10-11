import { onBeforeUnmount, onMounted, nextTick, type Ref } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

export interface FocusTrapOptions {
  /** Escape was pressed inside the dialog. */
  onEscape?: () => void
  /** CSS selector of the element to focus first; falls back to the first focusable element. */
  initialFocus?: string
}

/** Focusable descendants in DOM order. */
export function focusableIn(root: HTMLElement | null): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(el => el.getAttribute('aria-hidden') !== 'true')
}

/**
 * What every dialog needs: remember who opened it, move focus inside, keep Tab inside,
 * close on Escape and give the focus back when it goes away. Call it in the dialog's setup (the opener is
 * whatever has focus at that moment).
 */
export function useFocusTrap(panel: Ref<HTMLElement | null>, opts: FocusTrapOptions = {}) {
  const opener = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (opts.onEscape) {
        e.stopPropagation()
        opts.onEscape()
      }
      return
    }
    if (e.key !== 'Tab') return
    const items = focusableIn(panel.value)
    if (items.length === 0) {
      e.preventDefault()
      panel.value?.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || !panel.value?.contains(active))) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && (active === last || !panel.value?.contains(active))) { e.preventDefault(); first.focus() }
  }

  /** Move focus into the dialog (again), e.g. after its content has loaded. */
  async function focusInitial() {
    await nextTick()
    const el = (opts.initialFocus ? panel.value?.querySelector<HTMLElement>(opts.initialFocus) : null) ?? focusableIn(panel.value)[0] ?? panel.value
    el?.focus()
  }

  onMounted(() => {
    panel.value?.addEventListener('keydown', onKeydown)
    void focusInitial()
  })

  onBeforeUnmount(() => {
    panel.value?.removeEventListener('keydown', onKeydown)
  })

  // restore after the DOM is gone so the opener can take focus without the dialog fighting for it
  onBeforeUnmount(() => {
    if (opener?.isConnected) void nextTick().then(() => opener.focus())
  })

  return { focusInitial }
}
