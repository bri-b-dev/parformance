import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import LiveSession from '@/components/LiveSession.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import Toasts from '@/components/Toasts.vue'
import DrillDetail from '@/components/DrillDetail.vue'
import { summarizeResult } from '@/session/summary'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useRunStore } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { setConfirmHandler } from '@/utils/confirmService'
import { routes } from '@/router'
import type { Drill } from '@/types'

const Stub = { template: '<div />' }
const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)

const mkDrill = (metric: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  ({ id: 'd', title: 'Test-Drill', category: 'Putting', duration: { timerPreset: 120 }, instructions: { training: 'Putte los.', test: 'Zähle.' },
     metric: { type: 'streak', unit: 'Treffer', hcpTargets: { '54-0': [3, 5, 8] }, ...metric }, ...extra }) as unknown as Drill

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  setConfirmHandler(null)
  document.body.innerHTML = ''
})

function live(drill: Drill, value: number | null = null) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const w = mount(LiveSession, { attachTo: document.body, props: { drill, value, attempts: 0 }, global: { plugins: [pinia] } })
  return w
}

describe('LiveSession', () => {
  it('has dialog semantics, focuses the value field and keeps the screen awake request harmless', async () => {
    const w = live(mkDrill({}))
    await flushPromises()
    expect(w.find('[role="dialog"]').attributes('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(w.find('input.metric-input').element)
    expect(w.find('input.metric-input').attributes('inputmode')).toBe('numeric')
  })

  it('shows a big timer that runs, pauses, resumes and resets', async () => {
    vi.useFakeTimers()
    const w = live(mkDrill({}))
    await flushPromises()
    expect(q(w, 'live-clock').text()).toBe('00:00')
    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(q(w, 'live-clock').text()).toBe('00:03')
    expect(w.emitted('elapsed')!.at(-1)).toEqual([3])
    await q(w, 'live-pause').trigger('click')
    vi.advanceTimersByTime(5000)
    await flushPromises()
    expect(q(w, 'live-clock').text()).toBe('00:03')
    expect(q(w, 'live-pause').text()).toBe('Weiter')
    await q(w, 'live-pause').trigger('click')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(q(w, 'live-clock').text()).toBe('00:05')
    await q(w, 'live-reset').trigger('click')
    expect(q(w, 'live-clock').text()).toBe('00:00')
    expect(w.emitted('elapsed')!.at(-1)).toEqual([0])
  })

  it('marks the time as over once the preset is exceeded', async () => {
    vi.useFakeTimers()
    const w = live(mkDrill({ }, { duration: { timerPreset: 5 } }))
    await flushPromises()
    vi.advanceTimersByTime(6000)
    await flushPromises()
    expect(q(w, 'live-clock').classes()).toContain('over')
    expect(w.text()).toContain('Zeit abgelaufen')
  })

  it('has no timer for drills without a preset', async () => {
    const w = live(mkDrill({}, { duration: {} }))
    await flushPromises()
    expect(q(w, 'live-clock').exists()).toBe(false)
  })

  it('steps the value with big +/- buttons and respects the metric bounds', async () => {
    // streak: the first valid value is 1 and it cannot go below
    const a = live(mkDrill({}), null)
    await q(a, 'live-plus').trigger('click')
    expect(a.emitted('update:value')!.at(-1)).toEqual([1])
    await a.setProps({ value: 1 })
    expect((q(a, 'live-minus').element as HTMLButtonElement).disabled).toBe(true)
    await a.setProps({ value: 4 })
    await q(a, 'live-minus').trigger('click')
    expect(a.emitted('update:value')!.at(-1)).toEqual([3])

    // rating with a range: bounded on both sides
    const b = live(mkDrill({ type: 'rating', range: [1, 5] }), 5)
    expect((q(b, 'live-plus').element as HTMLButtonElement).disabled).toBe(true)
    await b.setProps({ value: 1 })
    expect((q(b, 'live-minus').element as HTMLButtonElement).disabled).toBe(true)

    // score vs par: negative values are possible without a minus key
    const c = live(mkDrill({ type: 'score_vs_par' }), null)
    await q(c, 'live-minus').trigger('click')
    expect(c.emitted('update:value')!.at(-1)).toEqual([-1])
    await c.setProps({ value: 0 })
    await q(c, 'live-minus').trigger('click')
    expect(c.emitted('update:value')!.at(-1)).toEqual([-1])
  })

  it('counts attempts for count_in_time drills', async () => {
    const w = live(mkDrill({ type: 'count_in_time' }))
    await q(w, 'attempts-inc').trigger('click')
    expect(w.emitted('update:attempts')!.at(-1)).toEqual([1])
    expect(live(mkDrill({})).find('[data-testid="attempts-inc"]').exists()).toBe(false)
  })

  it('enables saving only with a value and emits save', async () => {
    const w = live(mkDrill({}), null)
    expect((q(w, 'live-save').element as HTMLButtonElement).disabled).toBe(true)
    await w.setProps({ value: 4 })
    await q(w, 'live-save').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
  })

  it('shows the instructions on demand and cancels via button or Escape', async () => {
    const w = live(mkDrill({}))
    expect(q(w, 'live-flow').exists()).toBe(false)
    await q(w, 'live-flow-toggle').trigger('click')
    expect(q(w, 'live-flow').text()).toContain('Putte los.')
    expect(q(w, 'live-flow-toggle').attributes('aria-expanded')).toBe('true')
    await q(w, 'live-cancel').trigger('click')
    await w.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('cancel')).toHaveLength(2)
  })
})

describe('ResultSheet', () => {
  const drill = mkDrill({})
  const sheet = (opts: { value: number; previous: number[]; hcp?: number | null; nextLabel?: string }) => {
    const summary = summarizeResult({ drill, value: opts.value, previousValues: opts.previous, hcp: opts.hcp === undefined ? 20 : opts.hcp })
    return mount(ResultSheet, { attachTo: document.body, props: { summary, drillTitle: 'Test-Drill', previousCount: opts.previous.length, nextLabel: opts.nextLabel } })
  }

  it('shows result, stars, distance to the next level, best and average', () => {
    const w = sheet({ value: 5, previous: [3, 4] })
    expect(q(w, 'result-value').text()).toBe('5')
    expect(q(w, 'result-stars').text()).toBe('★★☆')
    expect(q(w, 'result-stars').attributes('aria-label')).toBe('Level 2 von 3')
    expect(q(w, 'result-next').text()).toBe('noch +3 bis ★★★')
    expect(q(w, 'result-compare').text()).toContain('Bestwert vorher: 4')
    expect(q(w, 'result-compare').text()).toMatch(/Ø letzte 2: 3,5/)
    expect(q(w, 'result-pb').exists()).toBe(true) // 5 beats 4
    expect(w.find('h2').text()).toBe('Neuer Bestwert!')
  })

  it('celebrates a personal best with confetti, but not with reduced motion', () => {
    expect(q(sheet({ value: 9, previous: [3] }), 'confetti').exists()).toBe(true)
    expect(q(sheet({ value: 2, previous: [3] }), 'confetti').exists()).toBe(false)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const reduced = sheet({ value: 9, previous: [3] })
    expect(q(reduced, 'confetti').exists()).toBe(false)
    expect(q(reduced, 'result-pb').exists()).toBe(true) // the badge stays
  })

  it('explains the first result and a missing handicap', () => {
    const w = sheet({ value: 4, previous: [], hcp: null })
    expect(w.text()).toContain('erstes Ergebnis')
    expect(q(w, 'result-stars').exists()).toBe(false)
    expect(q(w, 'result-next').text()).toContain('Handicap')
    expect(w.find('h2').text()).toBe('Gespeichert')
  })

  it('emits the chosen action together with the note', async () => {
    const w = sheet({ value: 5, previous: [3], nextLabel: 'Einheit abschließen' })
    expect(q(w, 'result-next-drill').text()).toBe('Einheit abschließen')
    await q(w, 'result-note').setValue('  Gut gefühlt ')
    await q(w, 'result-again').trigger('click')
    await q(w, 'result-next-drill').trigger('click')
    await q(w, 'result-done').trigger('click')
    await w.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('again')![0]).toEqual(['Gut gefühlt'])
    expect(w.emitted('next')).toHaveLength(1)
    expect(w.emitted('done')).toHaveLength(2) // Fertig and Escape
  })

  it('focuses "Nochmal" and is a modal dialog', async () => {
    const w = sheet({ value: 5, previous: [3] })
    await flushPromises()
    expect(w.find('[role="dialog"]').attributes('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(q(w, 'result-again').element)
  })
})

async function mountDetail(opts: { embedded?: boolean } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  const router = createRouter({ history: createMemoryHistory(), routes: stubbed as never })
  await router.push('/drill/x')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const settings = useSettingsStore()
  await settings.load()
  await settings.update({ hcp: 24 })
  const drill = catalog.drills.find(d => d.metric.type === 'streak' && d.duration?.timerPreset)!
  const toasts = mount(Toasts, { attachTo: document.body })
  const w = mount(DrillDetail, {
    attachTo: document.body,
    props: { drill, ...opts },
    global: { plugins: [pinia, router], stubs: { DrillSchema: true, HcpTargetsTable: true, DrillStatsSummary: true, SessionHistory: true, DrillDetailGrid: true } },
  })
  await flushPromises()
  return { w, toasts, drill, pinia, router, sessions: useSessionsStore(), ui: useUiStore(), run: useRunStore() }
}

async function playAndSave(w: ReturnType<typeof mount>, value: number) {
  await q(w, 'dd-start').trigger('click')
  await flushPromises()
  await w.find('input.metric-input').setValue(value)
  await q(w, 'live-save').trigger('click')
  await flushPromises()
}

describe('completion flow in the drill detail', () => {
  it('shows the sheet and an undo toast; undo removes the session and closes the sheet', async () => {
    const { w, toasts, sessions } = await mountDetail()
    await playAndSave(w, 6)
    expect(q(w, 'result-sheet-backdrop').exists()).toBe(true)
    expect(toasts.text()).toContain('Ergebnis gespeichert')
    expect(sessions.sessions).toHaveLength(1)

    await q(toasts, 'toast-action').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(0)
    expect(q(w, 'result-sheet-backdrop').exists()).toBe(false)
    expect(toasts.text()).toContain('zurückgenommen')
  })

  it('undo toast disappears after five seconds', async () => {
    vi.useFakeTimers()
    const { w, toasts } = await mountDetail()
    await playAndSave(w, 6)
    expect(q(toasts, 'toast-action').exists()).toBe(true)
    vi.advanceTimersByTime(4900)
    await flushPromises()
    expect(q(toasts, 'toast-action').exists()).toBe(true)
    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(q(toasts, 'toast-action').exists()).toBe(false)
  })

  it('quick entry also ends in the completion sheet', async () => {
    const { w, sessions } = await mountDetail()
    await q(w, 'dd-quick').trigger('click')
    await w.find('input.metric-input').setValue(4)
    await q(w, 'dd-save').trigger('click')
    await flushPromises()
    expect(sessions.sessions).toHaveLength(1)
    expect(q(w, 'result-value').text()).toBe('4')
  })

  it('saves the note, "Nochmal" starts the next live session', async () => {
    const { w, sessions } = await mountDetail()
    await playAndSave(w, 6)
    await q(w, 'result-note').setValue('Gutes Tempo')
    await q(w, 'result-again').trigger('click')
    await flushPromises()
    expect(sessions.sessions[0].notes).toBe('Gutes Tempo')
    expect(q(w, 'result-sheet-backdrop').exists()).toBe(false)
    expect(q(w, 'live').exists()).toBe(true)
    expect((w.find('input.metric-input').element as HTMLInputElement).value).toBe('')
  })

  it('compares with earlier results on the second run', async () => {
    const { w } = await mountDetail()
    await playAndSave(w, 3)
    await q(w, 'result-done').trigger('click')
    await playAndSave(w, 7)
    expect(q(w, 'result-pb').exists()).toBe(true)
    expect(q(w, 'result-compare').text()).toContain('Bestwert vorher: 3')
  })

  it('"Nächster Drill" opens the shuffle outside a guided session and advances inside one', async () => {
    const a = await mountDetail()
    await playAndSave(a.w, 6)
    await q(a.w, 'result-next-drill').trigger('click')
    expect(a.ui.shuffleOpen).toBe(true)
    expect(q(a.w, 'result-sheet-backdrop').exists()).toBe(false)

    const b = await mountDetail({ embedded: true })
    b.run.start({ title: 'E', drillIds: [b.drill.id, 'x'] })
    await flushPromises()
    await playAndSave(b.w, 6)
    expect(q(b.w, 'result-next-drill').text()).toBe('Nächster Drill')
    await q(b.w, 'result-next-drill').trigger('click')
    expect(b.run.run!.index).toBe(1)
  })

  it('asks before throwing away entered values in the live mode', async () => {
    const { w, sessions } = await mountDetail()
    await q(w, 'dd-start').trigger('click')
    await flushPromises()
    await w.find('input.metric-input').setValue(5)
    setConfirmHandler(async () => false)
    await q(w, 'live-cancel').trigger('click')
    await flushPromises()
    expect(q(w, 'live').exists()).toBe(true)
    setConfirmHandler(async () => true)
    await q(w, 'live-cancel').trigger('click')
    await flushPromises()
    expect(q(w, 'live').exists()).toBe(false)
    expect(sessions.sessions).toHaveLength(0)
  })

  it('cancels an untouched live session without asking', async () => {
    const { w } = await mountDetail()
    await q(w, 'dd-start').trigger('click')
    await flushPromises()
    await q(w, 'live-cancel').trigger('click')
    await flushPromises()
    expect(q(w, 'live').exists()).toBe(false)
  })
})

describe('guided session and undo', () => {
  it('a step whose session was undone becomes pending again', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const run = useRunStore()
    run.start({ title: 'T', drillIds: ['a', 'b'] })
    run.complete('s1')
    expect(run.run!.steps[0].status).toBe('done')
    run.forgetMissing([])
    expect(run.run!.steps[0]).toMatchObject({ status: 'pending' })
    expect(run.run!.steps[0].sessionId).toBeUndefined()
  })
})
