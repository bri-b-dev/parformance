import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import StatsView from '@/views/StatsView.vue'
import CategoryScoresChart from '@/components/CategoryScoresChart.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { routes } from '@/router'

const Stub = { template: '<div />' }

describe('Auswertung Aktuell / Historisch', () => {
  async function setup() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
    const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
    await router.push('/progress')
    const catalog = useDrillCatalogStore()
    await catalog.load()
    const drill = catalog.drills.find(d => d.id === 'putting_circle')!
    // played in January as a 40-handicapper (bucket 54-27: [4,6,8]) -> value 8 = level 3, stored with the session
    const history = useHcpHistoryStore()
    await history.replaceAll([
      { id: 'a', hcp: 40, valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-06-01T00:00:00.000Z' },
      { id: 'b', hcp: 5, valid_from: '2026-06-01T00:00:00.000Z', valid_to: null },
    ])
    const settings = useSettingsStore()
    await settings.load()
    await settings.update({ onboardingDone: true })
    const sessions = useSessionsStore()
    await sessions.load()
    await sessions.addSession({ drillId: drill.id, date: '2026-01-15T10:00:00.000Z', hcp: 40, result: { value: 8, unit: drill.metric.unit }, levelReached: 3 })
    const w = mount(StatsView, { global: { plugins: [pinia, router] } })
    await flushPromises()
    return { w, drill }
  }

  const putting = (w: ReturnType<typeof mount>) => w.findComponent(CategoryScoresChart).props('scores').Putting

  it('re-rates the old session with today\'s handicap in "Aktuell" and keeps it in "Historisch"', async () => {
    const { w } = await setup()
    // default is "Aktuell": HCP 5 -> bucket 11-0 [7,10,13] -> value 8 = level 1 of 3
    expect(w.find('[data-testid="eval-current"]').attributes('aria-checked')).toBe('true')
    expect(putting(w)).toBeCloseTo(33.3, 0)
    await w.find('[data-testid="eval-historical"]').trigger('click')
    await flushPromises()
    // historical: the stored level 3 of that session counts
    expect(putting(w)).toBe(100)
    await w.find('[data-testid="eval-current"]').trigger('click')
    await flushPromises()
    expect(putting(w)).toBeCloseTo(33.3, 0)
  })

  it('explains the selected mode in plain words', async () => {
    const { w } = await setup()
    expect(w.find('[data-testid="eval-help"]').text()).toContain('heutigen Handicap')
    await w.find('[data-testid="eval-historical"]').trigger('click')
    expect(w.find('[data-testid="eval-help"]').text()).toContain('Handicap, das damals galt')
    expect(w.find('[role="radiogroup"][aria-label="Auswertung"]').attributes('aria-describedby')).toBe('eval-help')
  })
})
