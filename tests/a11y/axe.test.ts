import { afterEach, describe, expect, it } from 'vitest'
import axe from 'axe-core'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import TodayView from '@/views/TodayView.vue'
import StatsView from '@/views/StatsView.vue'
import HistoryListView from '@/views/HistoryListView.vue'
import CollectionsView from '@/views/CollectionsView.vue'
import RunView from '@/views/RunView.vue'
import RandomizerView from '@/views/RandomizerView.vue'
import DrillList from '@/components/DrillList.vue'
import DrillDetail from '@/components/DrillDetail.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import LiveSession from '@/components/LiveSession.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BottomTabs from '@/components/BottomTabs.vue'
import HeaderBar from '@/components/HeaderBar.vue'
import TargetScale from '@/components/TargetScale.vue'
import HcpInput from '@/components/HcpInput.vue'
import { summarizeResult } from '@/session/summary'
import { EMPTY_FILTER } from '@/filters/catalog'
import { useCollectionsStore } from '@/stores/collections'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useFocusStore } from '@/stores/focus'
import { useRunStore } from '@/stores/run'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import ImportDialog from '@/components/ImportDialog.vue'
import BackupReminder from '@/components/BackupReminder.vue'
import { buildBackup, emptyData, parseBackup } from '@/backup/format'
import { requestConfirm } from '@/utils/confirmService'
import type { Drill } from '@/types'

/**
 * Automated accessibility audit of the real screens and dialogs with axe-core.
 * Serious and critical violations fail the build (this runs with `npm test` in CI).
 * Color contrast is not measured here (jsdom has no layout/colors): tests/a11y/contrast.test.ts guards the tokens.
 */
const Stub = { template: '<div />' }

const mounted: Array<{ unmount: () => void }> = []
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

async function audit(root: Element = document.body) {
  const result = await axe.run(root, {
    // jsdom cannot compute colors or page-level landmarks; both are covered elsewhere / not relevant for components
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false } },
    resultTypes: ['violations'],
  })
  return result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
}

function describeViolations(v: Awaited<ReturnType<typeof audit>>): string {
  return v.map(x => `${x.id} (${x.impact}): ${x.help}\n${x.nodes.slice(0, 3).map(n => '   ' + n.html.slice(0, 140)).join('\n')}`).join('\n')
}

async function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/today', name: 'Today', component: Stub },
      { path: '/drills', name: 'DrillsList', component: Stub },
      { path: '/drill/:id', name: 'DrillDetail', component: Stub },
      { path: '/collections', name: 'Collections', component: Stub },
      { path: '/run', name: 'Run', component: Stub },
      { path: '/progress', name: 'Progress', component: Stub },
      { path: '/progress/history', name: 'ProgressHistory', component: Stub },
      { path: '/handicap', component: Stub },
    ],
  })
  await router.push('/today')
  const catalog = useDrillCatalogStore()
  await catalog.load()
  const settings = useSettingsStore()
  await settings.load()
  await settings.update({ onboardingDone: true, hcp: 24, targetHcp: 12 })
  const sessions = useSessionsStore()
  await sessions.load()
  const drill = catalog.drills.find(d => d.id === 'putting_circle')!
  for (let i = 0; i < 4; i++) {
    await sessions.addSession({ drillId: drill.id, date: new Date(Date.now() - i * 86_400_000).toISOString(), hcp: 24, result: { value: 4 + i, unit: drill.metric.unit }, notes: i === 0 ? 'Gut' : undefined })
  }
  await useFavoritesStore().load()
  useCollectionsStore().add({ name: 'Vor der Runde', drillIds: [drill.id, catalog.drills[1].id], icon: '⛳' })
  useFocusStore().start({ label: 'Tempo' })
  return { pinia, router, catalog, drill }
}

async function check(name: string, make: (ctx: Awaited<ReturnType<typeof setup>>) => { component: Component; props?: Record<string, unknown>; attrs?: Record<string, unknown> }, prepare?: (ctx: Awaited<ReturnType<typeof setup>>) => Promise<void> | void) {
  it(name, async () => {
    const ctx = await setup()
    await prepare?.(ctx)
    const { component, props, attrs } = make(ctx)
    const w = mount(component, { attachTo: document.body, props, attrs, global: { plugins: [ctx.pinia, ctx.router], stubs: { DrillSchema: true } } })
    mounted.push(w)
    await flushPromises()
    const violations = await audit()
    expect(violations, describeViolations(violations)).toEqual([])
  })
}

describe('axe: screens', () => {
  check('Heute', () => ({ component: TodayView }))
  check('Drill-Katalog', () => ({ component: DrillList }))
  check('Fortschritt', () => ({ component: StatsView }))
  check('Verlauf', () => ({ component: HistoryListView }))
  check('Sammlungen', () => ({ component: CollectionsView }))
  check('Drill-Detail', ({ drill }) => ({ component: DrillDetail, props: { drill } }))
  check('Zielskala', ({ drill }) => ({ component: TargetScale, props: { drill } }))
  check('Geführte Einheit', () => ({ component: RunView }), ({ catalog }) => { useRunStore().start({ title: 'Test', drillIds: [catalog.drills[0].id, catalog.drills[1].id] }) })
  check('Tab-Leiste', () => ({ component: BottomTabs }))
  check('Kopfzeile', () => ({ component: HeaderBar }))
  check('Handicap-Eingabe', () => ({ component: HcpInput, props: { modelValue: 24.5, id: 'h', label: 'Handicap' } }))
})

describe('axe: dialogs', () => {
  check('Zufalls-Drill', () => ({ component: RandomizerView }))
  check('Filter-Sheet', ({ catalog }) => ({ component: FilterSheet, props: { filter: { ...EMPTY_FILTER, category: 'Putting' }, drills: catalog.drills, resultCount: 12, hasFavorites: false, targetKnown: true } }))
  check('Ergebnis-Sheet', ({ drill }) => ({
    component: ResultSheet,
    props: { summary: summarizeResult({ drill, value: 9, previousValues: [3, 5], hcp: 24 }), drillTitle: drill.title, previousCount: 2 },
  }))
  check('Live-Modus', ({ drill }) => ({ component: LiveSession, props: { drill: drill as Drill, value: 5, attempts: 0 } }))
  check('Einstellungen', () => ({ component: SettingsSheet, props: { open: true } }))
  check('Einführung', () => ({ component: OnboardingModal }), async () => { await useSettingsStore().update({ onboardingDone: false }) })

  it('Bestätigung', async () => {
    const ctx = await setup()
    const w = mount(ConfirmModal, { attachTo: document.body, global: { plugins: [ctx.pinia] } })
    mounted.push(w)
    void requestConfirm('Wirklich löschen?')
    await flushPromises()
    const violations = await audit()
    expect(violations, describeViolations(violations)).toEqual([])
  })

  it('Löschen mit Eingabe-Bestätigung', async () => {
    const ctx = await setup()
    const w = mount(ConfirmModal, { attachTo: document.body, global: { plugins: [ctx.pinia] } })
    mounted.push(w)
    void requestConfirm('Wirklich alles löschen?', {
      title: 'Alles löschen?', danger: true, confirmLabel: 'Alles löschen', phrase: 'LÖSCHEN', details: ['3 Sessions'],
      secondary: { label: 'Zuerst Backup exportieren', run: async () => true },
    })
    await flushPromises()
    const violations = await audit()
    expect(violations, describeViolations(violations)).toEqual([])
  })

  check('Backup einspielen', () => {
    const parsed = parseBackup(JSON.stringify(buildBackup({ ...emptyData(), favorites: ['a'], sessions: [{ id: 's', drillId: 'putting_circle', date: '2026-01-01T10:00:00.000Z', hcp: null, result: { value: 1, unit: 'x' } }] })))
    if (!parsed.ok) throw new Error('fixture must parse')
    return { component: ImportDialog, props: { result: parsed, current: emptyData() } }
  })

  check('Backup-Hinweis', () => ({ component: BackupReminder }), async () => {
    const sessions = useSessionsStore()
    for (let i = 0; i < 6; i++) await sessions.addSession({ drillId: 'putting_circle', date: new Date(Date.now() - (i + 5) * 86_400_000).toISOString(), hcp: 24, result: { value: i, unit: 'x' } })
  })
})
