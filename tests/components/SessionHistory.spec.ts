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
    // Patch existing jsdom window instead of replacing it to preserve Event constructors
    Object.assign(global.window, { localStorage: new LocalStorageMock() })
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
    await store.addSession({ id: 's1', drillId: 'd1', date: '2025-01-01T10:00:00Z', hcp: 12, result: { value: 5, unit: 'pts' }, attempts: 2, notes: 'erste Notiz' })
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

    // Snapshot the rendered HTML (Definition of Done)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('supports inline editing of notes and persists via store.updateNotes', async () => {
    const store = useSessionsStore()
    await store.load()

    await store.addSession({ id: 's10', drillId: 'dA', date: '2025-06-01T10:00:00Z', hcp: 18, result: { value: 3, unit: 'pts' } })

    const wrapper = mount(SessionHistory, { props: { drillId: 'dA' } })

    // Click notes edit
    const editBtn = await wrapper.find('[data-testid="notes-edit"]')
    expect(editBtn.exists()).toBe(true)
    await editBtn.trigger('click')

    const ta = wrapper.get('[data-testid="notes-textarea"]')
    await ta.setValue('neue Notiz')

    // Save notes
    const saveBtn = wrapper.get('[data-testid="notes-save"]')
    await saveBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    // Store should be updated
    const saved = store.listByDrill('dA')[0]
    expect(saved.notes).toBe('neue Notiz')

    // UI shows the new notes
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('neue Notiz')
  })
})
