import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import FocusCard from '@/components/FocusCard.vue'
import HistoryListView from '@/views/HistoryListView.vue'
import DrillDetail from '@/components/DrillDetail.vue'
import { useFocusStore } from '@/stores/focus'
import { useCollectionsStore } from '@/stores/collections'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useRunStore } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { setConfirmHandler } from '@/utils/confirmService'
import { routes } from '@/router'

const Stub = { template: '<div />' }

async function setup(path = '/today') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push(path)
  const catalog = useDrillCatalogStore()
  await catalog.load()
  return { pinia, router, catalog }
}

describe('FocusCard', () => {
  it('sets, edits and ends a focus', async () => {
    const { pinia, router } = await setup()
    const w = mount(FocusCard, { global: { plugins: [pinia, router] } })
    await flushPromises()
    expect(w.text()).toContain('Kein Fokus gesetzt')

    await w.find('[data-testid="focus-new"]').trigger('click')
    await w.find('[data-testid="focus-label"]').setValue('Tempo')
    await w.find('[data-testid="focus-form"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-testid="focus-active"]').text()).toBe('Tempo')
    expect(w.find('[data-testid="focus-count"]').text()).toContain('0 Sessions')

    await w.find('[data-testid="focus-edit"]').trigger('click')
    await w.find('[data-testid="focus-label"]').setValue('Tempo im Bunker')
    await w.find('[data-testid="focus-form"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-testid="focus-active"]').text()).toBe('Tempo im Bunker')

    setConfirmHandler(async () => true)
    await w.find('[data-testid="focus-end"]').trigger('click')
    await flushPromises()
    expect(useFocusStore().active).toBeUndefined()
    expect(w.text()).toContain('Kein Fokus gesetzt')
    setConfirmHandler(null)
  })

  it('starts the linked collection', async () => {
    const { pinia, router, catalog } = await setup()
    const col = useCollectionsStore().add({ name: 'Tempo-Block', drillIds: [catalog.drills[0].id, catalog.drills[1].id] })!
    useFocusStore().start({ label: 'Tempo', collectionId: col.id })
    const w = mount(FocusCard, { global: { plugins: [pinia, router] } })
    await flushPromises()
    expect(w.text()).toContain('Sammlung: Tempo-Block')
    await w.find('[data-testid="focus-start"]').trigger('click')
    await flushPromises()
    expect(useRunStore().run).toMatchObject({ title: 'Tempo-Block', collectionId: col.id })
    expect(router.currentRoute.value.name).toBe('Run')
  })
})

describe('focus in drill detail and history', () => {
  it('shows the focus chip and stores the focus with a saved session', async () => {
    const { pinia, router, catalog } = await setup('/drill/x')
    const f = useFocusStore().start({ label: 'Lag-Putting' })!
    const drill = catalog.drills.find(d => d.metric.type === 'streak')!
    const w = mount(DrillDetail, {
      props: { drill },
      global: {
        plugins: [pinia, router],
        stubs: { HcpTargetsTable: true, DrillStatsSummary: true, SessionHistory: true, GamblerTipPanel: true, SimpleTimer: true, DrillDetailGrid: true },
      },
    })
    await flushPromises()
    expect(w.find('[data-testid="focus-chip"]').text()).toContain('Lag-Putting')

    await w.find('[data-testid="dd-start"]').trigger('click')
    await w.find('input.metric-input').setValue(4)
    await w.find('[data-testid="dd-save"]').trigger('click')
    await flushPromises()
    const sessions = useSessionsStore()
    expect(sessions.sessions).toHaveLength(1)
    expect(sessions.sessions[0].focusId).toBe(f.id)
  })

  it('shows, assigns and filters by focus in the history', async () => {
    const { pinia, router, catalog } = await setup('/progress/history')
    const focus = useFocusStore()
    const f = focus.start({ label: 'Tempo' })!
    const sessions = useSessionsStore()
    await sessions.load()
    const mk = (i: number, focusId?: string) => sessions.addSession({
      drillId: catalog.drills[0].id, date: new Date(2026, 9, 10, 8, i).toISOString(), hcp: null,
      result: { value: i + 1, unit: catalog.drills[0].metric.unit }, ...(focusId ? { focusId } : {}),
    })
    await mk(1, f.id)
    await mk(2)
    const w = mount(HistoryListView, { global: { plugins: [pinia, router] } })
    await flushPromises()
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(2)
    expect(w.findAll('[data-testid="focus-chip"]')).toHaveLength(1)

    await w.find('[data-testid="history-focus-filter"]').setValue(f.id)
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(1)
    await w.find('[data-testid="history-focus-filter"]').setValue('none')
    expect(w.findAll('[data-testid="history-item"]')).toHaveLength(1)
    await w.find('[data-testid="history-focus-filter"]').setValue('')

    const selects = w.findAll('[data-testid="history-assign-focus"]')
    const unassigned = sessions.sessions.find(s => !s.focusId)!
    const idx = w.findAll('[data-testid="history-item"]').findIndex(i => !i.find('[data-testid="focus-chip"]').exists())
    await selects[idx].setValue(f.id)
    await flushPromises()
    expect(sessions.sessions.find(s => s.id === unassigned.id)!.focusId).toBe(f.id)
    await selects[idx].setValue('')
    await flushPromises()
    expect(sessions.sessions.find(s => s.id === unassigned.id)!.focusId).toBeUndefined()
  })
})
