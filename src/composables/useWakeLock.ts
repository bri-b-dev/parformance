import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * Keeps the screen on while `active` is true (Screen Wake Lock API, available in the Android WebView
 * and current browsers). Silently does nothing where it is not supported or the request is denied.
 */
export function useWakeLock(active: Ref<boolean>) {
  const held = ref(false)
  let sentinel: { release: () => Promise<void>; addEventListener?: (t: string, cb: () => void) => void } | null = null

  const supported = () => typeof navigator !== 'undefined' && !!(navigator as any).wakeLock?.request

  async function acquire() {
    if (!supported() || sentinel) return
    try {
      sentinel = await (navigator as any).wakeLock.request('screen')
      held.value = true
      sentinel?.addEventListener?.('release', () => { sentinel = null; held.value = false })
    } catch {
      sentinel = null
      held.value = false
    }
  }

  async function release() {
    const s = sentinel
    sentinel = null
    held.value = false
    try { await s?.release() } catch { /* already released */ }
  }

  // the lock is dropped when the page is hidden: take it again when it comes back
  function onVisible() {
    if (document.visibilityState === 'visible' && active.value) void acquire()
  }

  watch(active, (a) => { void (a ? acquire() : release()) }, { immediate: true })
  onMounted(() => document.addEventListener('visibilitychange', onVisible))
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisible)
    void release()
  })

  return { held, supported }
}
