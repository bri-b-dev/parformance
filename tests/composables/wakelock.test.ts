import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useWakeLock } from '@/composables/useWakeLock'

const mounted: Array<{ unmount: () => void }> = []

function setup(active = true) {
  const flag = ref(active)
  const Comp = defineComponent({ setup() { return useWakeLock(flag) }, template: '<div />' })
  const w = mount(Comp)
  mounted.push(w)
  return { flag, w }
}

function mockWakeLock(impl?: () => Promise<unknown>) {
  const release = vi.fn(async () => {})
  const request = vi.fn(impl ?? (async () => ({ release, addEventListener: () => {} })))
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, release }
}

afterEach(() => {
  // listeners of earlier components must not leak into the next test
  while (mounted.length) mounted.pop()!.unmount()
  delete (navigator as any).wakeLock
})

describe('useWakeLock', () => {
  it('requests a screen lock while active and releases it afterwards', async () => {
    const { request, release } = mockWakeLock()
    const { flag } = setup(true)
    await flushPromises()
    expect(request).toHaveBeenCalledWith('screen')
    flag.value = false
    await nextTick()
    await flushPromises()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('releases on unmount', async () => {
    const { release } = mockWakeLock()
    const { w } = setup(true)
    await flushPromises()
    w.unmount()
    await flushPromises()
    expect(release).toHaveBeenCalled()
  })

  it('does nothing without support and survives a denied request', async () => {
    expect(() => setup(true)).not.toThrow()
    mockWakeLock(async () => { throw new Error('denied') })
    const { w } = setup(true)
    await flushPromises()
    expect((w.vm as any).held).toBe(false)
  })

  it('takes the lock again when the page becomes visible after the browser dropped it', async () => {
    let onRelease: (() => void) | undefined
    const request = vi.fn(async () => ({
      release: async () => {},
      addEventListener: (_t: string, cb: () => void) => { onRelease = cb },
    }))
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    setup(true)
    await flushPromises()
    expect(request).toHaveBeenCalledTimes(1)

    onRelease?.() // page was hidden: the browser released the lock
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(request).toHaveBeenCalledTimes(2)
  })
})
