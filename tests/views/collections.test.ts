import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import CollectionsView from '@/views/CollectionsView.vue'
import { useCollectionsStore } from '@/stores/collections'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useRunStore } from '@/stores/run'
import { setConfirmHandler } from '@/utils/confirmService'
import { routes } from '@/router'

const Stub = { template: '<div />' }

async function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/collections')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const w = mount(CollectionsView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { w, router, catalog, collections: useCollectionsStore() }
}

describe('CollectionsView', () => {
  it('shows the empty state', async () => {
    const { w } = await mountView()
    expect(w.find('[data-testid="collection-empty"]').exists()).toBe(true)
  })

  it('creates a collection in four interactions: open, pick, pick, save (name typed)', async () => {
    const { w, catalog, collections } = await mountView()
    await w.find('[data-testid="collection-new"]').trigger('click') // 1
    await w.find('[data-testid="collection-name"]').setValue('Wedge-Woche')
    await w.find(`[data-testid="pick-${catalog.drills[3].id}"]`).setValue(true) // 2
    await w.find(`[data-testid="pick-${catalog.drills[1].id}"]`).setValue(true) // 3
    await w.find('[data-testid="collection-save"]').trigger('submit') // 4
    await flushPromises()
    expect(collections.items).toHaveLength(1)
    expect(collections.items[0]).toMatchObject({ name: 'Wedge-Woche', drillIds: [catalog.drills[3].id, catalog.drills[1].id] })
    expect(w.find('[data-testid="collection-item"]').text()).toContain('Wedge-Woche')
    expect(w.find('[data-testid="collection-item"]').text()).toContain('2 Drills')
  })

  it('does not allow saving without a name or drills', async () => {
    const { w, catalog } = await mountView()
    await w.find('[data-testid="collection-new"]').trigger('click')
    const save = () => (w.find('[data-testid="collection-save"]').element as HTMLButtonElement).disabled
    expect(save()).toBe(true)
    await w.find('[data-testid="collection-name"]').setValue('X')
    expect(save()).toBe(true)
    await w.find(`[data-testid="pick-${catalog.drills[0].id}"]`).setValue(true)
    expect(save()).toBe(false)
  })

  it('reorders drills while editing', async () => {
    const { w, catalog, collections } = await mountView()
    const [a, b] = [catalog.drills[0], catalog.drills[1]]
    collections.add({ name: 'Reihe', drillIds: [a.id, b.id] })
    await flushPromises()
    await w.find('[data-testid="collection-edit"]').trigger('click')
    await w.findAll('[data-testid="move-down"]')[0].trigger('click')
    await w.find('[data-testid="collection-save"]').trigger('submit')
    await flushPromises()
    expect(collections.items[0].drillIds).toEqual([b.id, a.id])
  })

  it('starts a guided session and deletes only after confirmation', async () => {
    const { w, router, catalog, collections } = await mountView()
    collections.add({ name: 'Start', drillIds: [catalog.drills[0].id, catalog.drills[1].id] })
    await flushPromises()
    await w.find('[data-testid="collection-start"]').trigger('click')
    await flushPromises()
    expect(useRunStore().run).toMatchObject({ title: 'Start' })
    expect(router.currentRoute.value.name).toBe('Run')

    setConfirmHandler(async () => false)
    await w.find('[data-testid="collection-delete"]').trigger('click')
    await flushPromises()
    expect(collections.items).toHaveLength(1)
    setConfirmHandler(async () => true)
    await w.find('[data-testid="collection-delete"]').trigger('click')
    await flushPromises()
    expect(collections.items).toHaveLength(0)
    setConfirmHandler(null)
  })
})

describe('collection icons', () => {
  it('picks an icon from the set by name, shows it, and offers a name for each button', async () => {
    const { w, catalog, collections } = await mountView()
    await w.find('[data-testid="collection-new"]').trigger('click')
    const buttons = w.findAll('.coll-icon')
    expect(buttons.length).toBeGreaterThanOrEqual(8)
    expect(buttons.every(b => !!b.attributes('aria-label')?.startsWith('Symbol '))).toBe(true)
    await buttons[1].trigger('click')
    expect(buttons[1].attributes('aria-pressed')).toBe('true')
    await w.find('[data-testid="collection-name"]').setValue('Mit Symbol')
    await w.find(`[data-testid="pick-${catalog.drills[0].id}"]`).setValue(true)
    await w.find('[data-testid="collection-save"]').trigger('submit')
    await flushPromises()
    expect(collections.items[0].icon).toBe('target')
    expect(w.find('[data-testid="collection-item"] svg').exists()).toBe(true)
  })

  it('still shows a collection that carries an emoji from earlier versions', async () => {
    const { w, collections, catalog } = await mountView()
    collections.add({ name: 'Alt', drillIds: [catalog.drills[0].id], icon: '⛳' })
    await flushPromises()
    expect(w.find('[data-testid="collection-item"]').text()).toContain('⛳')
  })
})
