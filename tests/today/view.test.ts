import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import TodayView from '@/views/TodayView.vue'
import { useSessionsStore } from '@/stores/sessions'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useRunStore } from '@/stores/run'
import { useCollectionsStore } from '@/stores/collections'
import { useFocusStore } from '@/stores/focus'
import { setConfirmHandler } from '@/utils/confirmService'

const Stub = { template: '<div />' }

async function mountToday(withSession: boolean, existing?: ReturnType<typeof createPinia>) {
  const pinia = existing ?? createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/drills', name: 'DrillsList', component: Stub },
      { path: '/drill/:id', name: 'DrillDetail', component: Stub },
      { path: '/today', name: 'Today', component: Stub },
      { path: '/collections', name: 'Collections', component: Stub },
      { path: '/run', name: 'Run', component: Stub },
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
  return { w, ui: useUiStore(), catalog, router }
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

  it('starts a guided session from the plan and filters by place', async () => {
    const { w, router, catalog } = await mountToday(false)
    await w.findAll('[data-testid="today-budget"] button').find(b => b.text() === '60 min')!.trigger('click')
    await w.findAll('[data-testid="today-locations"] button').find(b => b.text() === 'Putting')!.trigger('click')
    expect(w.findAll('[data-testid="today-budget"] ol li').length).toBeGreaterThan(0)
    await w.find('[data-testid="plan-start"]').trigger('click')
    await flushPromises()
    const run = useRunStore()
    expect(run.run).not.toBeNull()
    expect(run.run!.title).toContain('60-Minuten-Einheit, Putting')
    const byId = new Map(catalog.drills.map(d => [d.id, d]))
    expect(run.run!.steps.every(st => /putting|grün/i.test(byId.get(st.drillId)!.setup.location ?? ''))).toBe(true)
    expect(router.currentRoute.value.name).toBe('Run')
  })

  it('offers to resume or discard a running session and starts collections', async () => {
    const { w, catalog } = await mountToday(false)
    const collections = useCollectionsStore()
    collections.add({ name: 'Vor der Runde', drillIds: [catalog.drills[0].id, catalog.drills[1].id] })
    useRunStore().start({ title: 'Läuft', drillIds: [catalog.drills[2].id, catalog.drills[3].id] })
    await flushPromises()
    expect(w.find('[data-testid="today-resume"]').text()).toContain('Läuft')
    expect(w.find('[data-testid="today-resume"]').text()).toContain('Drill 1 von 2')
    expect(w.find('[data-testid="today-collections"]').text()).toContain('Vor der Runde')

    setConfirmHandler(async () => true)
    await w.find('[data-testid="today-discard"]').trigger('click')
    await flushPromises()
    expect(useRunStore().run).toBeNull()
    expect(w.find('[data-testid="today-resume"]').exists()).toBe(false)

    await w.find('[data-testid="today-collection-start"]').trigger('click')
    await flushPromises()
    expect(useRunStore().run).toMatchObject({ title: 'Vor der Runde' })
    expect(useRunStore().total).toBe(2)
    setConfirmHandler(null)
  })

  it('shows the focus card and prefers drills of the focus collection', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const catalog = useDrillCatalogStore()
    await catalog.load()
    const target = catalog.drills[40]
    const col = useCollectionsStore().add({ name: 'Fokus-Sammlung', drillIds: [target.id] })!
    useFocusStore().start({ label: 'Tempo', collectionId: col.id })
    const { w } = await mountToday(false, pinia)
    expect(w.find('[data-testid="focus-active"]').text()).toBe('Tempo')
    const first = w.find('[data-testid="today-suggestions"] li')
    expect(first.text()).toContain(target.title)
    expect(first.text()).toContain('Passt zu deinem Fokus „Tempo".')
  })
})
