import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import StatsView from '@/views/StatsView.vue'
import DrillProgressChart from '@/components/DrillProgressChart.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { routes } from '@/router'
import type { Drill } from '@/types'

const Stub = { template: '<div />' }
const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)
const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

async function setup(opts: { hcp?: number; target?: number; sessions?: { drillId?: string; value: number; daysAgo: number; level?: number; timer?: number }[] } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/progress')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const settings = useSettingsStore()
  await settings.load()
  await settings.update({ onboardingDone: true })
  if (opts.hcp !== undefined) await settings.update({ hcp: opts.hcp })
  if (opts.target !== undefined) await settings.update({ targetHcp: opts.target })
  const sessions = useSessionsStore()
  await sessions.load()
  const circle = catalog.drills.find(d => d.id === 'putting_circle')!
  for (const x of opts.sessions ?? []) {
    const d = x.drillId ? catalog.drills.find(c => c.id === x.drillId)! : circle
    await sessions.addSession({
      drillId: d.id, date: ago(x.daysAgo), hcp: opts.hcp ?? null, result: { value: x.value, unit: d.metric.unit },
      ...(x.level !== undefined ? { levelReached: x.level } : {}), ...(x.timer ? { timerUsed: x.timer } : {}),
    })
  }
  const w = mount(StatsView, { attachTo: document.body, global: { plugins: [pinia, router] } })
  await flushPromises()
  return { w, router, ui: useUiStore(), catalog, circle }
}

describe('Fortschritt', () => {
  it('shows the first-run card without sessions', async () => {
    const { w } = await setup()
    expect(w.text()).toContain('Keine Sessions bisher')
    expect(q(w, 'kpis').exists()).toBe(false)
  })

  it('starts with 30 days and shows labeled key figures', async () => {
    const { w } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 3, timer: 300 }, { value: 8, daysAgo: 1, timer: 300 }, { value: 4, daysAgo: 70 }] })
    expect(q(w, 'period-30').attributes('aria-checked')).toBe('true')
    expect(q(w, 'kpi-sessions').text()).toContain('Sessions')
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('2')
    expect(q(w, 'kpi-sessions').text()).toMatch(/Ø [\d,]+ pro Woche · 1 Drill/)
    expect(q(w, 'kpi-minutes').find('.kpi-value').text()).toContain('10')
    expect(q(w, 'kpi-minutes').text()).toContain('laut Timer')
    // 6 beat the earlier 4 and 8 beat the 6; the 4 itself is outside the period
    expect(q(w, 'kpi-pbs').find('.kpi-value').text()).toBe('2')
    expect(q(w, 'kpi-hcp').text()).toContain('20,0')
  })

  it('switches the period and explains an empty result with a way out', async () => {
    const { w } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 3 }, { value: 4, daysAgo: 70 }] })
    await q(w, 'period-7').trigger('click')
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('1')
    await q(w, 'period-0').trigger('click')
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('2')
    expect(q(w, 'trend-note').exists()).toBe(true) // no comparison for "Alles"
  })

  it('falls back to "Alles" when nothing happened in the last 30 days', async () => {
    const { w } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 100 }] })
    expect(q(w, 'period-0').attributes('aria-checked')).toBe('true')
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('1')
  })

  it('shows an empty filter with next steps instead of empty charts', async () => {
    const { w, ui } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 20 }] })
    await q(w, 'period-7').trigger('click')
    const empty = q(w, 'stats-filter-empty')
    expect(empty.exists()).toBe(true)
    expect(q(w, 'kpis').exists()).toBe(false)
    await q(w, 'stats-show-all').trigger('click')
    expect(q(w, 'stats-filter-empty').exists()).toBe(false)
    expect(q(w, 'kpis').exists()).toBe(true)
    await q(w, 'period-7').trigger('click')
    await w.find('[data-testid="stats-filter-empty"] .btn-primary').trigger('click')
    expect(ui.shuffleOpen).toBe(true)
  })

  it('filters by category chips', async () => {
    const { w, catalog } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 3 }, { drillId: catalog0(), value: 3, daysAgo: 2 }] })
    void catalog
    const chips = w.findAll('[data-testid="stats-category"] .fchip')
    expect(chips.length).toBeGreaterThan(2)
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('2')
    await chips.find(c => c.text() === 'Putting')!.trigger('click')
    expect(q(w, 'kpi-sessions').find('.kpi-value').text()).toBe('1')
    expect(w.findAll('[data-testid="trend-table"] tbody tr')).toHaveLength(1)
  })

  it('has a table with the trend per category as the accessible alternative', async () => {
    const { w } = await setup({ hcp: 20, sessions: [{ value: 6, daysAgo: 3, level: 3 }, { value: 4, daysAgo: 40, level: 1 }] })
    const row = q(w, 'trend-Putting')
    expect(row.exists()).toBe(true)
    // "Aktuell": 6 at HCP 20 (bucket [6,8,10]) is level 1 = 33 %, the 4 before is level 0
    expect(row.text()).toContain('33 %')
    expect(row.text()).toContain('▲')
    expect(row.text()).toContain('+33 Pkt ggü. dem Zeitraum davor')
    expect(w.find('table caption').text()).toContain('Fähigkeiten je Kategorie')
  })

  it('lists next steps as sentences with actions, no bare numbers', async () => {
    const { w, router, ui, circle } = await setup({ hcp: 20, target: 5, sessions: [{ value: 3, daysAgo: 2 }] })
    const step = w.findAll('[data-testid="next-step"]')[0]
    expect(step.text()).toMatch(/Circle|Putting Circle/i)
    expect(step.text()).toMatch(/zuletzt 3, Ziel für HCP 5 ist \d+\./)
    await step.find('[data-testid="step-start"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('DrillDetail')
    expect(router.currentRoute.value.params.id).toBe(circle.id)
    expect(ui.startRequest).toBe(circle.id)
    // details does not request a start
    await router.push('/progress')
    ui.startRequest = ''
    await w.findAll('[data-testid="next-step"]')[0].find('[data-testid="step-details"]').trigger('click')
    await flushPromises()
    expect(ui.startRequest).toBe('')
  })

  it('asks for the handicap when there is nothing to compare with', async () => {
    const { w } = await setup({ sessions: [{ value: 3, daysAgo: 2 }] })
    expect(q(w, 'next-empty').text()).toContain('Dein Handicap fehlt')
  })

  it('says everything is fine when no drill is below target', async () => {
    const { w } = await setup({ hcp: 20, sessions: [{ value: 99, daysAgo: 2 }] })
    expect(q(w, 'next-empty').text()).toContain('Alles im grünen Bereich')
  })
})

function catalog0() {
  // a drill outside "Putting" for the category filter test
  return 'chipping_9m_chip'
}

describe('SegmentedControl', () => {
  const options = [{ value: 1, label: 'Eins' }, { value: 2, label: 'Zwei' }, { value: 3, label: 'Drei' }]
  it('is a radio group that follows arrow keys, Home and End', async () => {
    const w = mount(SegmentedControl, { attachTo: document.body, props: { modelValue: 2, options, label: 'Test', testid: 't' } })
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.find('[data-testid="t-2"]').attributes('aria-checked')).toBe('true')
    expect(w.find('[data-testid="t-1"]').attributes('tabindex')).toBe('-1')
    await w.find('[data-testid="t-2"]').trigger('keydown', { key: 'ArrowRight' })
    await w.find('[data-testid="t-2"]').trigger('keydown', { key: 'ArrowLeft' })
    await w.find('[data-testid="t-2"]').trigger('keydown', { key: 'Home' })
    await w.find('[data-testid="t-2"]').trigger('keydown', { key: 'End' })
    await w.find('[data-testid="t-3"]').trigger('click')
    expect(w.emitted('update:modelValue')!.map(e => e[0])).toEqual([3, 1, 1, 3, 3])
  })
})

describe('DrillProgressChart', () => {
  const drill = { id: 'x', title: 'X', category: 'Putting', metric: { type: 'streak', unit: 'x', hcpTargets: { '54-0': [3, 5, 8] } } } as unknown as Drill

  async function chart(values: { v: number; daysAgo: number }[], hcp: number | null = 20) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    if (hcp !== null) await settings.update({ hcp })
    const sessions = useSessionsStore()
    await sessions.load()
    for (const x of values) await sessions.addSession({ drillId: 'x', date: ago(x.daysAgo), hcp: null, result: { value: x.v, unit: 'x' } })
    const w = mount(DrillProgressChart, { props: { drill }, global: { plugins: [pinia] } })
    await flushPromises()
    return w
  }

  it('explains the empty state with the next step', async () => {
    const w = await chart([])
    expect(q(w, 'chart-empty').text()).toContain('Speichere eine Session')
  })

  it('draws a dot per result and a dashed line per level with an accessible summary', async () => {
    const w = await chart([{ v: 4, daysAgo: 40 }, { v: 6, daysAgo: 10 }, { v: 9, daysAgo: 1 }])
    expect(w.findAll('[data-testid="dot"]')).toHaveLength(3)
    expect([1, 2, 3].every(l => q(w, `line-${l}`).exists())).toBe(true)
    expect(q(w, 'chart-summary').text()).toBe('3 Ergebnisse, erstes 4, letztes 9, Bestwert 9.')
    expect(w.find('svg').attributes('role')).toBe('img')
    expect(w.find('svg').attributes('aria-label')).toContain('3 Ergebnisse')
  })

  it('zooms to 30 days and explains an empty zoom', async () => {
    const w = await chart([{ v: 4, daysAgo: 100 }, { v: 6, daysAgo: 60 }])
    expect(w.findAll('[data-testid="dot"]')).toHaveLength(2)
    await q(w, 'zoom-30').trigger('click')
    expect(w.findAll('[data-testid="dot"]')).toHaveLength(0)
    expect(q(w, 'chart-empty').text()).toContain('längeren')
    await q(w, 'zoom-0').trigger('click')
    expect(w.findAll('[data-testid="dot"]')).toHaveLength(2)
  })

  it('draws no level lines without a handicap', async () => {
    const w = await chart([{ v: 4, daysAgo: 3 }], null)
    expect(q(w, 'line-1').exists()).toBe(false)
    expect(w.findAll('[data-testid="dot"]')).toHaveLength(1)
  })
})
