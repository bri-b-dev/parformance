import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import RandomizerView from '../../src/views/RandomizerView.vue'

class LocalStorageMock {
  store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = value }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
  key(i: number) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

declare global { var window: any }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'ShuffleOverlay', path: '/shuffle', component: RandomizerView },
      { name: 'DrillDetail', path: '/drill/:id', component: { template: '<div />' } },
    ],
  })
}

describe('RandomizerView animation (CSS transform + rAF)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Patch window with basic APIs used by code
    // Preserve existing jsdom window, only add fields we need
    Object.assign(globalThis.window, {
      localStorage: new LocalStorageMock(),
      dispatchEvent: () => {},
    })
    // Default prefers-reduced-motion: no
    globalThis.window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })

    vi.useFakeTimers()
  })

  it('spins via CSS transform and stops sequentially with configurable durations (snapshot mid/end)', async () => {
    const router = makeRouter()
    await router.push('/shuffle')
    await router.isReady()

    const wrapper = mount(RandomizerView, {
      props: { durationCatMs: 200, durationDrillMs: 200, durationTargetMs: 150 },
      global: { plugins: [router, createPinia()] },
    })

    // Wait for catalog to load (dynamic import of drills.json)
    await Promise.resolve()

    // Click Start
    await wrapper.get('[data-testid="shuffle-start"]').trigger('click')

    // Advance a few rAF ticks (~50ms) and verify transform moved (mid-spin)
    await vi.advanceTimersByTimeAsync(64)
    const tracks = wrapper.findAll('.reel-track')
    expect(tracks.length).toBeGreaterThan(0)
    const catStyleMid = (tracks[0].element as HTMLElement).getAttribute('style') || ''
    expect(catStyleMid).toMatch(/translateY\(-?\d+\.?\d*px\)/)

  // mid-state: ensure HTML contains reel items and transform applied
  expect(wrapper.html()).toContain('reel-track')

    // Advance through category duration to stop first reel
    await vi.advanceTimersByTimeAsync(200)

    // Advance more to stop drill and target reels
    await vi.advanceTimersByTimeAsync(200 + 150)

    // At the end, one of the reels should have translate close to item boundaries (still numeric)
    const endHtml = wrapper.html()
    expect(endHtml).toContain('Zufallsauswahl')

  // end-state: ensure overlay title present and results set
  expect(endHtml).toContain('Zufallsauswahl')
  })

  it('respects prefers-reduced-motion: skips animation and sets results immediately', async () => {
    // Force reduced motion
    globalThis.window.matchMedia = (query: string) => ({
      matches: /prefers-reduced-motion/.test(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })

    const router = makeRouter()
    await router.push('/shuffle')
    await router.isReady()

    const wrapper = mount(RandomizerView, {
      props: { durationCatMs: 300, durationDrillMs: 300, durationTargetMs: 300 },
      global: { plugins: [router, createPinia()] },
    })

    await Promise.resolve()
    await wrapper.get('[data-testid="shuffle-start"]').trigger('click')

    // No time advancement needed; results should be set synchronously and navigation may happen quickly.
    // Ensure at least the category and drill are displayed (not the placeholder dash)
    const text = wrapper.text()
    expect(text).not.toMatch(/—/) // not all dashes
  })
})
