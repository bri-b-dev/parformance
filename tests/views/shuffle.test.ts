import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import RandomizerView from '@/views/RandomizerView.vue'
import DrillDetail from '@/components/DrillDetail.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { routes } from '@/router'
import { locationGroup } from '@/filters/location'

const Stub = { template: '<div />' }

async function open(opts: { reduced?: boolean; hcp?: number; opener?: HTMLElement } = {}) {
  if (opts.reduced) vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/today')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const settings = useSettingsStore()
  await settings.load()
  if (opts.hcp !== undefined) await settings.update({ hcp: opts.hcp })
  const ui = useUiStore()
  ui.setShuffle(true)
  opts.opener?.focus()
  const w = mount(RandomizerView, { attachTo: document.body, global: { plugins: [pinia, router] } })
  await flushPromises()
  return { w, router, ui, catalog, pinia }
}

const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('shuffle overlay', () => {
  it('does not start on its own and focuses the spin button', async () => {
    const { w } = await open()
    expect(q(w, 'shuffle-result').exists()).toBe(false)
    expect(q(w, 'shuffle-spin').exists()).toBe(true)
    expect(document.activeElement).toBe(q(w, 'shuffle-spin').element)
  })

  it('spins, can be skipped and then shows the result card without navigating', async () => {
    const { w, router } = await open()
    await q(w, 'shuffle-spin').trigger('click')
    await flushPromises()
    expect(q(w, 'shuffle-skip').exists()).toBe(true)
    await q(w, 'shuffle-skip').trigger('click')
    await flushPromises()
    const card = q(w, 'shuffle-result')
    expect(card.exists()).toBe(true)
    expect(card.text()).toMatch(/\d+ Min\./)
    expect(q(w, 'shuffle-announce').text()).toContain('Zufalls-Drill:')
    expect(router.currentRoute.value.name).toBe('Today')
  })

  it('shows the result instantly with reduced motion', async () => {
    const { w } = await open({ reduced: true })
    await q(w, 'shuffle-spin').trigger('click')
    await flushPromises()
    expect(q(w, 'shuffle-result').exists()).toBe(true)
    expect(q(w, 'shuffle-skip').exists()).toBe(false)
  })

  it('draws five times in a row without navigating (and without repeats)', async () => {
    const { w, router } = await open({ reduced: true })
    await q(w, 'shuffle-spin').trigger('click')
    const seen: string[] = []
    for (let i = 0; i < 5; i++) {
      await flushPromises()
      seen.push(q(w, 'shuffle-result').find('h3').text())
      if (i < 4) await q(w, 'shuffle-again').trigger('click')
    }
    expect(router.currentRoute.value.name).toBe('Today')
    expect(new Set(seen).size).toBe(5)
  })

  it('shows category, difficulty and the target for the current handicap', async () => {
    const { w, catalog } = await open({ reduced: true, hcp: 24 })
    await w.findAll('[aria-label="Kategorie"] .fchip').find(b => b.text() === 'Putting')!.trigger('click')
    await q(w, 'shuffle-spin').trigger('click')
    await flushPromises()
    const card = q(w, 'shuffle-result')
    const drill = catalog.drills.find(d => d.title === card.find('h3').text())!
    expect(drill.category).toBe('Putting')
    expect(card.text()).toContain('Putting')
    expect(q(w, 'result-difficulty').attributes('aria-label')).toMatch(/Schwierigkeit [1-5] von 5/)
    expect(q(w, 'result-target').text()).toMatch(/Ziel bei HCP 24,0: /)
  })

  it('asks for a handicap when none is known', async () => {
    const { w } = await open({ reduced: true })
    await q(w, 'shuffle-spin').trigger('click')
    await flushPromises()
    expect(q(w, 'result-target').text()).toContain('Trage dein Handicap ein')
  })

  it('filters the pool by place, duration and category and can reset', async () => {
    const { w, catalog } = await open({ reduced: true })
    const all = catalog.drills.length
    expect(q(w, 'pool-count').text()).toContain(`${all} Drills`)
    await w.findAll('[aria-label="Ort"] .fchip').find(b => b.text() === 'Bunker')!.trigger('click')
    const bunker = catalog.drills.filter(d => locationGroup(d) === 'Bunker').length
    expect(q(w, 'pool-count').text()).toContain(`${bunker} Drills`)
    await w.findAll('[aria-label="Dauer"] .fchip')[0].trigger('click') // bis 10 Min.
    expect(Number(/(\d+)/.exec(q(w, 'pool-count').text())![1])).toBeLessThanOrEqual(bunker)
    await w.findAll('[aria-label="Kategorie"] .fchip').find(b => b.text() === 'Putting')!.trigger('click')
    expect(q(w, 'shuffle-empty').exists()).toBe(true)
    expect(q(w, 'shuffle-spin').exists()).toBe(false)
    await q(w, 'shuffle-empty').find('button').trigger('click')
    expect(q(w, 'pool-count').text()).toContain(`${all} Drills`)
  })

  it('"Starten" opens the drill with the session requested and closes the overlay; "Details" does not request it', async () => {
    const a = await open({ reduced: true })
    await q(a.w, 'shuffle-spin').trigger('click')
    await flushPromises()
    const id = a.catalog.drills.find(d => d.title === q(a.w, 'shuffle-result').find('h3').text())!.id
    await q(a.w, 'shuffle-start').trigger('click')
    await flushPromises()
    expect(a.router.currentRoute.value.name).toBe('DrillDetail')
    expect(a.router.currentRoute.value.params.id).toBe(id)
    expect(a.ui.startRequest).toBe(id)
    expect(a.ui.shuffleOpen).toBe(false)

    const b = await open({ reduced: true })
    await q(b.w, 'shuffle-spin').trigger('click')
    await flushPromises()
    await q(b.w, 'shuffle-details').trigger('click')
    await flushPromises()
    expect(b.router.currentRoute.value.name).toBe('DrillDetail')
    expect(b.ui.startRequest).toBe('')
  })

  it('prefers favorites when the switch is on and explains it', async () => {
    const { w, catalog } = await open({ reduced: true })
    const sw = q(w, 'bias-favorites')
    expect((sw.element as HTMLInputElement).disabled).toBe(true)
    expect(w.text()).toContain('Markiere Drills mit ☆')
    const favs = useFavoritesStore()
    await favs.toggle(catalog.drills[0].id)
    await flushPromises()
    expect((sw.element as HTMLInputElement).disabled).toBe(false)
    expect(w.text()).toContain('deutlich häufiger')
  })

  it('avoids the drills of the last sessions', async () => {
    const { w, catalog } = await open({ reduced: true })
    const sessions = useSessionsStore()
    // the pool is reduced to 3 drills via filters; two of them were played last
    await w.findAll('[aria-label="Ort"] .fchip').find(b => b.text() === 'Bunker')!.trigger('click')
    const pool = catalog.drills.filter(d => locationGroup(d) === 'Bunker')
    for (const d of pool.slice(0, pool.length - 1)) {
      await sessions.addSession({ drillId: d.id, date: new Date().toISOString(), hcp: null, result: { value: 1, unit: d.metric.unit } })
    }
    await q(w, 'shuffle-spin').trigger('click')
    await flushPromises()
    expect(q(w, 'shuffle-result').find('h3').text()).toBe(pool[pool.length - 1].title)
  })

  it('closes with Escape and gives the focus back to the opener', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    const { w, ui } = await open({ opener })
    await w.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(ui.shuffleOpen).toBe(false)
    w.unmount()
    expect(document.activeElement).toBe(opener)
  })

  it('exposes dialog semantics and a close button', async () => {
    const { w, ui } = await open()
    const dialog = w.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBe('shuffle-title')
    await q(w, 'shuffle-close').trigger('click')
    expect(ui.shuffleOpen).toBe(false)
  })
})

describe('start requested from the overlay', () => {
  it('opens the drill with a running session', async () => {
    const { pinia, router, catalog, ui } = await open()
    const drill = catalog.drills.find(d => d.metric.type === 'streak')!
    ui.requestStart(drill.id)
    const w = mount(DrillDetail, {
      props: { drill },
      global: { plugins: [pinia, router], stubs: { HcpTargetsTable: true, DrillStatsSummary: true, SessionHistory: true, GamblerTipPanel: true, SimpleTimer: true, DrillDetailGrid: true } },
    })
    await flushPromises()
    expect(w.findAll('button').some(b => b.text() === 'Speichern')).toBe(true)
    expect(ui.startRequest).toBe('')
  })
})
