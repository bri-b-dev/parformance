import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StatsView from '../../src/views/StatsView.vue'
import { useDrillCatalogStore } from '../../src/stores/drillCatalog'
import { useSessionsStore } from '../../src/stores/sessions'
import CategoryScoresChart from '../../src/components/CategoryScoresChart.vue'

describe('Stats filters (category, period)', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('period filter updates results', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const catalog = useDrillCatalogStore()
  const sessions = useSessionsStore()

    // prepare drills: two categories
    catalog.drills = [
      { id: 'd1', title: 'Drill 1', category: 'A', updatedAt: new Date().toISOString() },
      { id: 'd2', title: 'Drill 2', category: 'B', updatedAt: new Date().toISOString() },
    ] as any
    catalog.loaded = true

    const now = new Date()
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days ago

    sessions.sessions = [
      { id: 's1', drillId: 'd1', date: now.toISOString(), levelReached: 3 } as any,
      { id: 's2', drillId: 'd2', date: old.toISOString(), levelReached: 3 } as any,
    ]
    sessions.loaded = true

  const wrapper = mount(StatsView, { global: { plugins: [pinia] } })
    await wrapper.vm.$nextTick()

    // initial (All) should show non-zero for both categories
    const chart = wrapper.findComponent(CategoryScoresChart)
    const scoresAll = chart.props('scores') as Record<string, number>
    expect(typeof scoresAll['A']).toBe('number')
    expect(typeof scoresAll['B']).toBe('number')
    expect(scoresAll['A']).toBeGreaterThan(0)
    expect(scoresAll['B']).toBeGreaterThan(0)

    // Set period to 7 days -> only recent session should remain
    const sel = wrapper.get('[data-testid="stats-period"]')
    await sel.setValue('7')
    await wrapper.vm.$nextTick()

    const scores7 = wrapper.findComponent(CategoryScoresChart).props('scores') as Record<string, number>
    expect(scores7['A']).toBeGreaterThan(0)
    // category B session is older than 7 days => becomes zero
    expect(scores7['B']).toBe(0)
  })
})
