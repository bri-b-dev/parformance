import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DrillDetail from '@/components/DrillDetail.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { useFavoritesStore } from '@/stores/favorites'
import { routes } from '@/router'
import type { Drill } from '@/types'

const Stub = { template: '<div />' }

async function mountDetail(pick: (d: Drill[]) => Drill, extra: { embedded?: boolean } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/drill/x')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const drill = pick(catalog.drills)
  const w = mount(DrillDetail, {
    attachTo: document.body,
    props: { drill, ...extra },
    global: {
      plugins: [pinia, router],
      stubs: {
        DrillSchema: { template: '<div data-testid="schema" />' },
        HcpTargetsTable: { template: '<div data-testid="targets" />' },
        DrillStatsSummary: { template: '<div data-testid="stats" />' },
        SessionHistory: { template: '<div data-testid="history" />' },
      },
    },
  })
  await flushPromises()
  return { w, drill, sessions: useSessionsStore(), catalog }
}

const withTimer = (ds: Drill[]) => ds.find(d => d.duration?.timerPreset && d.metric.type === 'streak' && d.instructions.tooEasy)!
const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)

afterEach(() => { document.body.innerHTML = '' })

describe('drill detail structure', () => {
  it('has a head with title, meta, favorite and the two start actions', async () => {
    const { w, drill } = await mountDetail(withTimer)
    const head = q(w, 'dd-head')
    expect(head.text()).toContain(drill.title)
    expect(head.text()).toContain(drill.category)
    expect(q(w, 'dd-minutes').text()).toMatch(/\d+ Min\./)
    expect(q(w, 'dd-difficulty').attributes('aria-label')).toMatch(/Schwierigkeit [1-5] von 5/)
    expect(q(w, 'dd-start').text()).toBe('Starten')
    expect(q(w, 'dd-quick').text()).toBe('Ergebnis eintragen')
    expect(head.find('[aria-pressed]').attributes('aria-label')).toBe('Zu Favoriten hinzufügen')
    await head.find('[aria-pressed]').trigger('click')
    await flushPromises()
    expect(useFavoritesStore().isFavorite(drill.id)).toBe(true)
  })

  it('shows the diagram first in the Aufbau tab', async () => {
    const { w } = await mountDetail(withTimer)
    const panel = q(w, 'dd-panel')
    const html = panel.html()
    expect(html.indexOf('data-testid="schema"')).toBeGreaterThan(-1)
    expect(html.indexOf('data-testid="schema"')).toBeLessThan(html.indexOf('Was du brauchst'))
  })

  it('switches between Aufbau, Ablauf, Ziele and Verlauf with proper tab semantics', async () => {
    const { w, drill } = await mountDetail(withTimer)
    expect(q(w, 'dd-tab-setup').attributes('aria-selected')).toBe('true')
    await q(w, 'dd-tab-flow').trigger('click')
    expect(q(w, 'dd-panel').text()).toContain(drill.instructions.training.slice(0, 30))
    expect(q(w, 'dd-tab-flow').attributes('aria-selected')).toBe('true')
    expect(q(w, 'dd-tab-setup').attributes('tabindex')).toBe('-1')
    await q(w, 'dd-tab-goals').trigger('click')
    expect(q(w, 'targets').exists()).toBe(true)
    expect(q(w, 'stats').exists()).toBe(true)
    await q(w, 'dd-tab-history').trigger('click')
    expect(q(w, 'history').exists()).toBe(true)
    expect(q(w, 'targets').exists()).toBe(false)
  })

  it('supports arrow keys, Home and End on the tab list', async () => {
    const { w } = await mountDetail(withTimer)
    await q(w, 'dd-tab-setup').trigger('keydown', { key: 'ArrowRight' })
    expect(q(w, 'dd-tab-flow').attributes('aria-selected')).toBe('true')
    await q(w, 'dd-tab-flow').trigger('keydown', { key: 'End' })
    expect(q(w, 'dd-tab-history').attributes('aria-selected')).toBe('true')
    await q(w, 'dd-tab-history').trigger('keydown', { key: 'ArrowRight' }) // wraps
    expect(q(w, 'dd-tab-setup').attributes('aria-selected')).toBe('true')
    await q(w, 'dd-tab-setup').trigger('keydown', { key: 'ArrowLeft' }) // wraps back
    expect(q(w, 'dd-tab-history').attributes('aria-selected')).toBe('true')
    expect(document.activeElement?.getAttribute('data-testid')).toBe('dd-tab-history')
  })

  it('keeps "Zu leicht?" and variants in a collapsed section and offers the tip', async () => {
    const { w, drill } = await mountDetail(withTimer)
    const extra = q(w, 'dd-extra')
    expect(extra.exists()).toBe(true)
    expect((extra.element as HTMLDetailsElement).open).toBe(false)
    expect(extra.text()).toContain(drill.instructions.tooEasy!.slice(0, 20))
    expect(w.text()).toContain('Zocker-Tipp')
  })

  it('omits the extras section for drills without hints or variants', async () => {
    const { w } = await mountDetail(ds => ({ ...ds[0], variants: [], instructions: { ...ds[0].instructions, tooEasy: undefined } }) as Drill)
    expect(q(w, 'dd-extra').exists()).toBe(false)
  })

  it('drops the sticky behaviour when embedded in a guided session', async () => {
    const { w } = await mountDetail(withTimer, { embedded: true })
    expect(w.find('section').classes()).toContain('dd-embedded')
  })
})

describe('session flow', () => {
  it('Starten opens the live mode with a running timer; saving shows the completion sheet', async () => {
    const { w, drill, sessions } = await mountDetail(withTimer)
    await q(w, 'dd-start').trigger('click')
    await flushPromises()
    expect(q(w, 'live').exists()).toBe(true)
    expect(q(w, 'live-clock').exists()).toBe(true)
    expect((q(w, 'live-save').element as HTMLButtonElement).disabled).toBe(true)
    await w.find('input.metric-input').setValue(7)
    expect((q(w, 'live-save').element as HTMLButtonElement).disabled).toBe(false)
    await q(w, 'live-save').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(1)
    expect(sessions.sessions[0]).toMatchObject({ drillId: drill.id, result: { value: 7 } })
    expect(sessions.sessions[0].timerUsed).toBeDefined()
    expect(q(w, 'live').exists()).toBe(false)
    expect(q(w, 'result-value').text()).toBe('7')
  })

  it('quick entry needs two taps (open, save), focuses the field and skips the timer', async () => {
    const { w, drill, sessions } = await mountDetail(withTimer)
    await q(w, 'dd-quick').trigger('click') // tap 1
    await flushPromises()
    expect(q(w, 'dd-active').text()).toBe('Ergebnis erfassen')
    expect(q(w, 'timer').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('input.metric-input').element)
    expect(q(w, 'dd-tab-setup').attributes('aria-selected')).toBe('true') // tab unchanged
    await w.find('input.metric-input').setValue(5)
    await q(w, 'dd-save').trigger('click') // tap 2
    await flushPromises()
    expect(sessions.sessions).toHaveLength(1)
    expect(sessions.sessions[0]).toMatchObject({ drillId: drill.id, result: { value: 5 } })
    expect(sessions.sessions[0].timerUsed).toBeUndefined()
  })

  it('cancel discards the entry without saving', async () => {
    const { w, sessions } = await mountDetail(withTimer)
    await q(w, 'dd-quick').trigger('click')
    await w.find('input.metric-input').setValue(9)
    await q(w, 'dd-cancel').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(0)
    expect(q(w, 'dd-session').exists()).toBe(false)
    await q(w, 'dd-quick').trigger('click')
    expect((w.find('input.metric-input').element as HTMLInputElement).value).toBe('')
  })

  it('count_in_time drills offer the attempts counter', async () => {
    const { w } = await mountDetail(ds => ds.find(d => d.metric.type === 'count_in_time')!)
    await q(w, 'dd-start').trigger('click')
    await flushPromises()
    await q(w, 'attempts-inc').trigger('click')
    await q(w, 'attempts-inc').trigger('click')
    expect(q(w, 'attempts-chip').text()).toContain('2')
  })
})
