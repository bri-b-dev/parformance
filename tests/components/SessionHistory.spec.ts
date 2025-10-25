import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SessionHistory from '../../src/components/SessionHistory.vue'
import { useSessionsStore } from '../../src/stores/sessions'

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

describe('SessionHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // @ts-expect-error set global window
    global.window = { localStorage: new LocalStorageMock() }
    vi.useFakeTimers()
  })

  it('renders empty state when there are no sessions', async () => {
    const wrapper = mount(SessionHistory, { props: { drillId: 'd1' } })
    const store = useSessionsStore()
    await store.load()

    // Wait next tick for computed to update
    await Promise.resolve()

    expect(wrapper.text()).toContain('Noch keine Einträge')
  })

  it('lists sessions for a drill, sorted by date desc with attempts/timer chips', async () => {
    const store = useSessionsStore()
    await store.load()

    // Seed some sessions across drills
    await store.addSession({ id: 's1', drillId: 'd1', date: '2025-01-01T10:00:00Z', hcp: 12, result: { value: 5, unit: 'pts' }, attempts: 2 })
    await store.addSession({ id: 's2', drillId: 'd1', date: '2025-02-01T10:00:00Z', hcp: 12, result: { value: 7, unit: 'pts' }, timerUsed: 90 })
    await store.addSession({ id: 's3', drillId: 'd2', date: '2025-03-01T10:00:00Z', hcp: 12, result: { value: 9, unit: 'pts' } })

    const wrapper = mount(SessionHistory, { props: { drillId: 'd1' } })

    // Run timers to flush debounced persistence (not strictly required for UI rendering)
    vi.runOnlyPendingTimers()

    const rows = wrapper.findAll('li')
    // Should list only d1 sessions
    expect(rows.length).toBe(2)
    // Sorted desc: s2 first (2025-02...), then s1 (2025-01...)
    expect(wrapper.text()).toMatch(/7 pts[\s\S]*5 pts/)
    // Chips visible
    expect(wrapper.text()).toContain('↻ 2')
    expect(wrapper.text()).toContain('⏱️ 01:30')
  })
})
