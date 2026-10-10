import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TargetScale from '@/components/TargetScale.vue'
import LevelStars from '@/components/LevelStars.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import DrillCard from '@/components/DrillCard.vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import type { Drill } from '@/types'

const Stub = { template: '<div />' }
const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)

const streak = {
  id: 'streak', title: 'Serie', category: 'Putting', difficulty: { base: 4, scale: '1-5' },
  metric: { type: 'streak', unit: 'Treffer', hcpTargets: { '54-27': [3, 5, 7], '26-12': [5, 7, 9], '11-0': [8, 10, 13] } },
} as unknown as Drill

const strokes = {
  id: 'strokes', title: 'Schläge', category: 'Chipping',
  metric: { type: 'sum', unit: 'Schläge', smallerIsBetter: true, hcpTargets: { '54-0': [30, 27, 24] } },
} as unknown as Drill

async function mountScale(drill: Drill, opts: { hcp?: number | null; target?: number | null; values?: number[] } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore()
  await settings.load()
  if (opts.hcp != null) await settings.update({ hcp: opts.hcp })
  if (opts.target != null) await settings.update({ targetHcp: opts.target })
  const sessions = useSessionsStore()
  await sessions.load()
  let i = 0
  for (const v of opts.values ?? []) {
    await sessions.addSession({ drillId: drill.id, date: new Date(2026, 0, 1 + i++).toISOString(), hcp: null, result: { value: v, unit: drill.metric.unit } })
  }
  const w = mount(TargetScale, { props: { drill }, global: { plugins: [pinia], stubs: { HcpTargetsTable: { template: '<div data-testid="table" />' } } } })
  await flushPromises()
  return { w, ui: useUiStore() }
}

afterEach(() => { document.body.innerHTML = '' })

describe('TargetScale', () => {
  it('shows the next threshold in one line and all thresholds below', async () => {
    const { w } = await mountScale(streak, { hcp: 20, values: [4, 6] })
    // HCP 20 -> bucket 26-12 [5,7,9]; best 6 -> level 1, next ★★ ab 7
    expect(q(w, 'ts-status').text()).toBe('Nächste Stufe ★★ ab 7: dein Bestwert 6, noch +1.')
    expect(q(w, 'ts-thresholds').text()).toBe('Bei HCP 20,0: ★ ab 5 · ★★ ab 7 · ★★★ ab 9')
    expect(q(w, 'ts-best').exists()).toBe(true)
    expect(q(w, 'ts-last').exists()).toBe(false) // the last result is the best one
  })

  it('draws three markers left to right plus the best and a differing last result', async () => {
    const { w } = await mountScale(streak, { hcp: 20, values: [8, 5] })
    const left = (id: string) => parseFloat((q(w, id).attributes('style') ?? '').match(/left:\s*([\d.]+)%/)![1])
    expect(left('ts-marker-1')).toBeLessThan(left('ts-marker-2'))
    expect(left('ts-marker-2')).toBeLessThan(left('ts-marker-3'))
    expect(q(w, 'ts-last').exists()).toBe(true)
    expect(left('ts-last')).toBeLessThan(left('ts-best'))
    expect(q(w, 'ts-scale').attributes('aria-hidden')).toBe('true') // the text carries the information
  })

  it('says so when the top level is reached and when there is no result yet', async () => {
    const top = await mountScale(streak, { hcp: 20, values: [12] })
    expect(q(top.w, 'ts-status').text()).toBe('Höchste Stufe ★★★ erreicht (Bestwert 12).')
    const none = await mountScale(streak, { hcp: 20 })
    expect(q(none.w, 'ts-status').text()).toBe('Noch kein Ergebnis: ★ ab 5.')
    expect(q(none.w, 'ts-best').exists()).toBe(false)
  })

  it('counts downwards for smaller-is-better drills', async () => {
    const { w } = await mountScale(strokes, { hcp: 20, values: [29] })
    expect(q(w, 'ts-status').text()).toBe('Nächste Stufe ★★ bis 27: dein Bestwert 29, noch −2.')
    expect(q(w, 'ts-thresholds').text()).toBe('Bei HCP 20,0: ★ bis 30 · ★★ bis 27 · ★★★ bis 24')
  })

  it('switches between my handicap and the target handicap', async () => {
    const { w } = await mountScale(streak, { hcp: 20, target: 8, values: [6] })
    expect(q(w, 'ts-mine').attributes('aria-checked')).toBe('true')
    expect(q(w, 'ts-mine').text()).toContain('20,0')
    expect(q(w, 'ts-target').text()).toContain('8,0')

    await q(w, 'ts-target').trigger('click')
    // target HCP 8 -> bucket 11-0 [8,10,13]; the goal is level 2 = 10
    expect(q(w, 'ts-target').attributes('aria-checked')).toBe('true')
    expect(q(w, 'ts-status').text()).toBe('Ziel ★★ ab 10: dein Bestwert 6, noch +4.')
    expect(q(w, 'ts-thresholds').text()).toBe('Bei HCP 8,0: ★ ab 8 · ★★ ab 10 · ★★★ ab 13')
    expect(q(w, 'ts-marker-2').classes()).toContain('goal')

    await q(w, 'ts-mine').trigger('click')
    expect(q(w, 'ts-status').text()).toContain('Nächste Stufe ★★ ab 7')
  })

  it('reports a reached target', async () => {
    const { w } = await mountScale(streak, { hcp: 20, target: 8, values: [11] })
    await q(w, 'ts-target').trigger('click')
    expect(q(w, 'ts-status').text()).toBe('Ziel erreicht: dein Bestwert 11 liegt über 10.')
  })

  it('offers no switch without a target handicap', async () => {
    const { w } = await mountScale(streak, { hcp: 20 })
    expect(q(w, 'ts-target').exists()).toBe(false)
  })

  it('asks for a handicap when none is known and opens the full table', async () => {
    const { w, ui } = await mountScale(streak)
    expect(q(w, 'ts-missing').exists()).toBe(true)
    expect(q(w, 'ts-scale').exists()).toBe(false)
    expect((w.find('details').element as HTMLDetailsElement).open).toBe(true)
    await q(w, 'ts-missing').find('button').trigger('click')
    expect(ui.settingsOpen).toBe(true)
  })

  it('keeps the full table available but collapsed once a handicap is known', async () => {
    const { w } = await mountScale(streak, { hcp: 20 })
    expect(q(w, 'table').exists()).toBe(true)
    expect((w.find('details').element as HTMLDetailsElement).open).toBe(false)
  })
})

describe('LevelStars', () => {
  it('shows shape, number and an accessible name for every level', () => {
    const texts = [0, 1, 2, 3].map(l => mount(LevelStars, { props: { level: l } }).text())
    expect(texts).toEqual(['☆☆☆Level 0', '★☆☆Level 1', '★★☆Level 2', '★★★Level 3'])
    expect(mount(LevelStars, { props: { level: 2 } }).attributes('aria-label')).toBe('Level 2 von 3')
    expect(mount(LevelStars, { props: { level: null } }).attributes('aria-label')).toBe('Kein Level')
  })
  it('has distinct styling classes per level and a compact variant without text', () => {
    expect(mount(LevelStars, { props: { level: 1 } }).classes()).toContain('lvl-1')
    expect(mount(LevelStars, { props: { level: 3 } }).classes()).toContain('lvl-3')
    expect(mount(LevelStars, { props: { level: 2, compact: true } }).text()).toBe('★★☆')
  })
})

describe('LevelBadge and DrillCard', () => {
  async function badge(values: number[], hcp: number | null) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    if (hcp !== null) await settings.update({ hcp })
    const sessions = useSessionsStore()
    await sessions.load()
    let i = 0
    for (const v of values) await sessions.addSession({ drillId: streak.id, date: new Date(2026, 0, 1 + i++).toISOString(), hcp: null, result: { value: v, unit: 'Treffer' } })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Stub }, { path: '/drill/:id', name: 'DrillDetail', component: Stub }] })
    await router.push('/')
    return { pinia, router }
  }

  it('shows the level of the latest session evaluated with the current handicap', async () => {
    const { pinia } = await badge([4, 8], 20) // bucket [5,7,9]: 8 -> level 2
    const w = mount(LevelBadge, { props: { drill: streak, compact: true }, global: { plugins: [pinia] } })
    await flushPromises()
    expect(w.text()).toBe('★★☆')
    expect(w.attributes('title')).toContain('Level 2 von 3')
  })

  it('shows "no level" without a session', async () => {
    const { pinia } = await badge([], 20)
    const w = mount(LevelBadge, { props: { drill: streak }, global: { plugins: [pinia] } })
    await flushPromises()
    expect(w.attributes('aria-label')).toBe('Kein Level')
  })

  it('the drill card shows difficulty as dots and the level as stars', async () => {
    const { pinia, router } = await badge([8], 20)
    const w = mount(DrillCard, { props: { drill: streak }, global: { plugins: [pinia, router] } })
    await flushPromises()
    expect(w.text()).toContain('●●●●○')
    expect(w.find('[aria-label="Schwierigkeit 4 von 5"]').exists()).toBe(true)
    expect(w.text()).toContain('★★☆')
  })
})
