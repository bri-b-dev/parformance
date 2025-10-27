import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DrillDetail from '../../src/components/DrillDetail.vue'
import DrillList from '../../src/components/DrillList.vue'
import type { Drill } from '../../src/types'
import { useFavoritesStore } from '../../src/stores/favorites'

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

let pinia: ReturnType<typeof createPinia>

const sampleDrill: Drill = {
  id: 'chip_carry_zone',
  title: 'Carry Zone',
  category: 'Chipping Green',
  equipment: { balls: 6, clubs: ['Wedge'] },
  setup: { schema: '6 Landebänder im Meterabstand', location: 'Chipping Green' },
  duration: { suggestedMin: 5, timerPreset: 300 },
  instructions: { training: 'Abwechselnd kurz→lang die Carry-Zonen treffen.' },
  metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: { '54-27': [2,3,4] } },
}

describe('Favorites: ☆ toggle wiring and persistence', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    // Patch existing jsdom window instead of replacing it to preserve Event constructors
    Object.assign(globalThis.window, { localStorage: new LocalStorageMock(), dispatchEvent: () => {} })
    vi.useFakeTimers()
  })

  it('DrillDetail ☆ toggle updates favorites state immediately and persists (debounced)', async () => {
    const wrapper = mount(DrillDetail, {
      props: { drill: sampleDrill },
      global: { plugins: [pinia] },
    })

    const store = useFavoritesStore()
    await store.load()
    expect(store.list).toEqual([])

    // Find the favorite button (title="Favorit") and click
    const favBtn = wrapper.find('button[title="Favorit"]')
    expect(favBtn.exists()).toBe(true)

    // Initial aria-pressed should be false
    expect(favBtn.attributes('aria-pressed')).toBe('false')

    await favBtn.trigger('click')

    // State should reflect immediately
    expect(store.list).toEqual(['chip_carry_zone'])
    // aria-pressed should update
    expect(wrapper.find('button[title="Favorit"]').attributes('aria-pressed')).toBe('true')

    // Not yet persisted (debounced)
    const key = 'parformance.favorites.v1'
    expect(globalThis.window.localStorage.store[key]).toBeUndefined()

    // Flush timers to perform write
    vi.runOnlyPendingTimers()

    // Persisted favorites should contain the drill id
    const persisted = JSON.parse(globalThis.window.localStorage.store[key])
    expect(persisted).toEqual(['chip_carry_zone'])

    // Click again to remove
    await favBtn.trigger('click')
    expect(store.list).toEqual([])

    vi.runOnlyPendingTimers()
    const persistedAfter = JSON.parse(globalThis.window.localStorage.store[key])
    expect(persistedAfter).toEqual([])
  })

  it('DrillList favorites filter reflects immediately after toggling a favorite', async () => {
    // Mount the list component (it loads catalog + favorites on mount)
  const wrapper = mount(DrillList, { global: { plugins: [pinia] } })

    // Wait a microtask for onMounted hooks
    await Promise.resolve()

    // Activate the favorites-only filter by checking the checkbox
    const favCheckbox = wrapper.get('#filter-fav')
    await favCheckbox.setValue(true)

    // With no favorites yet, the empty state should be visible
    expect(wrapper.text()).toContain('Keine Drills gefunden')

    // Toggle a favorite in the store; the list should reflect immediately
    const store = useFavoritesStore()
    await store.load()
    await store.toggle('chip_carry_zone')

  // Run timers to persist, though UI should already update reactively
  vi.runOnlyPendingTimers()
  // Wait for component reactivity to propagate
  await nextTick()
  await nextTick()

  // Now one or more items should be shown (at least the favorited drill)
  const cards = wrapper.findAll('article.card')
    expect(cards.length).toBeGreaterThan(0)
    // Sanity: one of the cards should link to the favorited drill id
  const hasFav = cards.some(c => c.find('a').exists() && (c.find('a').attributes('href') || '').includes('chip_carry_zone'))
  expect(hasFav).toBe(true)
  })
})
