import { ref, onBeforeUnmount } from 'vue'

export interface UseTimerOptions {
  presetSeconds?: number
}

export interface UseTimer {
  elapsed: ReturnType<typeof ref<number>>
  running: ReturnType<typeof ref<boolean>>
  start: () => void
  pause: () => void
  reset: () => void
}

/**
 * Very small timer composable that tracks elapsed seconds when started.
 * - start(): begins ticking once per second
 * - pause(): stops ticking (keeps elapsed)
 * - reset(): stops and sets elapsed back to 0
 *
 * Consumers can read `elapsed.value` and watch it if needed.
 */
export function useTimer(options: UseTimerOptions = {}): UseTimer {
  const elapsed = ref(0)
  const running = ref(false)
  let timer: any = null

  function clear() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    if (running.value) return
    running.value = true
    timer = setInterval(() => {
      elapsed.value += 1
    }, 1000)
  }

  function pause() {
    running.value = false
    clear()
  }

  function reset() {
    pause()
    elapsed.value = 0
  }

  onBeforeUnmount(() => clear())

  // The preset is currently informational for the UI; elapsed always starts at 0.
  void options?.presetSeconds

  return { elapsed, running, start, pause, reset }
}
