import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import RunView from '@/views/RunView.vue'
import { useRunStore } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { setConfirmHandler } from '@/utils/confirmService'

const Stub = { template: '<div />' }

async function mountRun(drillCount = 3) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/run', name: 'Run', component: Stub }, { path: '/today', name: 'Today', component: Stub }],
  })
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const run = useRunStore()
  const ids = catalog.drills.slice(0, drillCount).map(d => d.id)
  if (drillCount > 0) run.start({ title: 'Test-Einheit', drillIds: ids })
  await router.push('/run')
  const w = mount(RunView, { global: { plugins: [pinia, router], stubs: { DrillDetail: { template: '<div data-testid="drill-stub" />' } } } })
  await flushPromises()
  return { w, run, router, catalog, ids, sessions: useSessionsStore() }
}

describe('RunView', () => {
  it('redirects to Heute without a run', async () => {
    const { router } = await mountRun(0)
    expect(router.currentRoute.value.name).toBe('Today')
  })

  it('shows position, progress and planned time', async () => {
    const { w } = await mountRun(3)
    expect(w.find('[data-testid="run-position"]').text()).toBe('Drill 1 von 3')
    expect(w.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(w.find('[data-testid="run-time"]').text()).toMatch(/Geplant \d+ Min\. - noch ca\. \d+ Min\./)
    expect((w.find('[data-testid="run-next"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((w.find('[data-testid="run-back"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('completes a step when a session is saved and then allows moving on', async () => {
    const { w, sessions, catalog, ids } = await mountRun(3)
    await sessions.addSession({ drillId: ids[0], date: new Date(Date.now() + 1000).toISOString(), hcp: null, result: { value: 4, unit: catalog.drills[0].metric.unit } })
    await flushPromises()
    expect(w.find('[role="status"]').text()).toContain('Ergebnis gespeichert')
    expect((w.find('[data-testid="run-next"]').element as HTMLButtonElement).disabled).toBe(false)
    await w.find('[data-testid="run-next"]').trigger('click')
    expect(w.find('[data-testid="run-position"]').text()).toBe('Drill 2 von 3')
    expect(w.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
  })

  it('skips, finishes with a summary and closes back to Heute', async () => {
    const { w, run, router } = await mountRun(2)
    await w.find('[data-testid="run-skip"]').trigger('click')
    expect(w.find('[data-testid="run-position"]').text()).toBe('Drill 2 von 2')
    expect(w.find('[data-testid="run-next"]').text()).toBe('Abschließen')
    await w.find('[data-testid="run-skip"]').trigger('click')
    expect(run.finished).toBe(true)
    const summary = w.find('[data-testid="run-summary"]')
    expect(summary.text()).toContain('Einheit abgeschlossen')
    expect(summary.text()).toContain('0 von 2 Drills gespeichert')
    expect(summary.text()).toContain('Übersprungen')
    await w.find('[data-testid="run-close"]').trigger('click')
    await flushPromises()
    expect(run.run).toBeNull()
    expect(router.currentRoute.value.name).toBe('Today')
  })

  it('ends early only after confirmation', async () => {
    const { w, run } = await mountRun(3)
    setConfirmHandler(async () => false)
    await w.find('[data-testid="run-end"]').trigger('click')
    await flushPromises()
    expect(run.finished).toBe(false)
    setConfirmHandler(async () => true)
    await w.find('[data-testid="run-end"]').trigger('click')
    await flushPromises()
    expect(run.finished).toBe(true)
    setConfirmHandler(null)
  })
})
