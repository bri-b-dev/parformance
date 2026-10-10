import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import HistoryListView from '@/views/HistoryListView.vue'
import { useSessionsStore } from '@/stores/sessions'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { setConfirmHandler } from '@/utils/confirmService'
import { routes } from '@/router'

const Stub = { template: '<div />' }

async function mountView(sessionCount: number) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/progress/history')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const sessions = useSessionsStore()
  await sessions.load()
  const [a, b] = catalog.drills
  for (let i = 0; i < sessionCount; i++) {
    const d = i % 2 === 0 ? a : b
    await sessions.addSession({
      drillId: d.id, date: new Date(2026, 9, 10, 8, i % 60).toISOString(), hcp: 20,
      result: { value: i + 1, unit: d.metric.unit }, levelReached: 2, notes: i === 0 ? 'Gutes Gefühl' : undefined,
    })
  }
  const w = mount(HistoryListView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { w, sessions, catalog, a, b }
}

describe('HistoryListView', () => {
  it('shows the empty state without sessions', async () => {
    const { w } = await mountView(0)
    expect(w.find('[data-testid="history-empty"]').exists()).toBe(true)
  })

  it('lists sessions grouped by day with level, PB, notes and summary', async () => {
    const { w, a } = await mountView(3)
    expect(w.findAll('[data-testid="history-day"]')).toHaveLength(1)
    expect(w.find('[data-testid="history-day"] h2').text()).toMatch(/\S/)
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(3)
    expect(w.text()).toContain('Gutes Gefühl')
    expect(w.text()).toContain('★★☆')
    expect(w.find('[data-testid="history-summary"]').text()).toMatch(/3\s+Sessions/)
    expect(w.text()).toContain(a.title)
    expect(w.findAll('[data-testid="pb-chip"]').length).toBeGreaterThan(0)
  })

  it('filters by category', async () => {
    const { w, a } = await mountView(4)
    await w.find('[data-testid="history-category"]').setValue(a.category)
    const items = w.findAll('[data-testid="history-item"]')
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(4)
  })

  it('pages with "Mehr anzeigen"', async () => {
    const { w } = await mountView(35)
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(30)
    await w.find('[data-testid="history-more"]').trigger('click')
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(35)
    expect(w.find('[data-testid="history-more"]').exists()).toBe(false)
  })

  it('deletes a session only after confirmation', async () => {
    const { w, sessions } = await mountView(2)
    setConfirmHandler(async () => false)
    await w.find('[data-testid="history-delete"]').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(2)
    setConfirmHandler(async () => true)
    await w.find('[data-testid="history-delete"]').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(1)
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(1)
    setConfirmHandler(null)
  })
})
