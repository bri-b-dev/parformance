import { onBeforeUnmount, onMounted } from 'vue'

let locks = 0
let previous = ''

/** Stops the page behind a dialog from scrolling; counted so stacked dialogs release it only once. */
export function useScrollLock() {
  let held = false

  onMounted(() => {
    if (typeof document === 'undefined') return
    if (locks === 0) {
      previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    locks++
    held = true
  })

  onBeforeUnmount(() => {
    if (!held) return
    held = false
    locks = Math.max(0, locks - 1)
    if (locks === 0 && typeof document !== 'undefined') document.body.style.overflow = previous
  })
}
