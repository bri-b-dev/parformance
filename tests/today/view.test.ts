import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import TodayView from '@/views/TodayView.vue'
import { useSessionsStore } from '@/stores/sessions'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'

const Stub = { template: '<div />' }

async function mountToday(withSession: boolean) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/drills', name: 'DrillsList', component: Stub },
      { path: '/drill/:id', name: 'DrillDetail', component: Stub },
      { path: '/today', name: 'Today', component: Stub },
    ],
  })
  await router.push('/today')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const sessions = useSessionsStore()
  await sessions.load()
  const settings = useSettingsStore()
  await settings.load()
  if (withSession) {
    await sessions.addSession({
      drillId: catalog.drills[0].id, date: new Date().toISOString(), hcp: 20,
      result: { value: 5, unit: catalog.drills[0].metric.unit },
    })
  }
  const w = mount(TodayView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { w, ui: useUiStore(), catalog }
}

describe('TodayView', () => {
  it('shows the first-run card and three suggestions without sessions', async () => {
    const { w, ui } = await mountToday(false)
    expect(w.find('[data-testid="today-empty"]').exists()).toBe(true)
    expect(w.find('[data-testid="today-continue"]').exists()).toBe(false)
    expect(w.findAll('[data-testid="today-suggestions"] li')).toHaveLength(3)
    await w.find('[data-testid="today-empty"] button').trigger('click')
    expect(ui.shuffleOpen).toBe(true)
  })

  it('shows continue, streak and week after a session', async () => {
    const { w, catalog } = await mountToday(true)
    expect(w.find('[data-testid="today-empty"]').exists()).toBe(false)
    expect(w.find('[data-testid="today-continue"]').text()).toContain(catalog.drills[0].title)
    expect(w.find('[data-testid="today-stats"]').text()).toMatch(/1\s+Tag in Folge/)
  })

  it('builds a plan that fits the chosen budget', async () => {
    const { w } = await mountToday(false)
    await w.findAll('[data-testid="today-budget"] button').find(b => b.text() === '30 min')!.trigger('click')
    const total = w.find('[data-testid="plan-total"]').text()
    const m = /zusammen (\d+) von 30 Minuten/.exec(total)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeLessThanOrEqual(30)
  })
})
