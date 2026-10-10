import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OnboardingModal from '@/components/OnboardingModal.vue'
import HcpHint from '@/components/HcpHint.vue'
import HcpTargetsTable from '@/components/HcpTargetsTable.vue'
import { useSettingsStore } from '@/stores/settings'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import type { Drill } from '@/types'

async function open() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore()
  await settings.load()
  const w = mount(OnboardingModal, { attachTo: document.body, global: { plugins: [pinia] } })
  await flushPromises()
  return { w, settings, pinia }
}

const field = (w: ReturnType<typeof mount>, id: string) => w.find(`#${id}`)

describe('onboarding wizard', () => {
  it('walks through two steps and saves handicap, goal and date', async () => {
    const { w, settings } = await open()
    expect(w.find('[data-testid="onb-step"]').text()).toBe('Schritt 1 von 2')
    await field(w, 'onb-hcp').setValue('24,5')
    await w.find('form').trigger('submit')
    expect(w.find('[data-testid="onb-step"]').text()).toBe('Schritt 2 von 2')
    await field(w, 'onb-target').setValue('18')
    await field(w, 'onb-date').setValue('2027-06-01')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(settings.hcp).toBe(24.5)
    expect(settings.targetHcp).toBe(18)
    expect(settings.targetDate).toBe('2027-06-01')
    expect(settings.onboardingDone).toBe(true)
    expect(w.find('dialog').exists()).toBe(false)
  })

  it('accepts plus handicaps and stores them as negative numbers', async () => {
    const { w, settings } = await open()
    await field(w, 'onb-hcp').setValue('+2,5')
    expect(w.text()).toContain('Plus-Handicap')
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(settings.hcp).toBe(-2.5)
  })

  it('each step can be skipped and nothing is stored', async () => {
    const { w, settings } = await open()
    await w.find('[data-testid="onb-skip"]').trigger('click')
    expect(w.find('[data-testid="onb-step"]').text()).toBe('Schritt 2 von 2')
    await w.find('[data-testid="onb-skip"]').trigger('click')
    await flushPromises()
    expect(settings.onboardingDone).toBe(true)
    expect(settings.hcp).toBeNull()
    expect(settings.targetHcp).toBeNull()
  })

  it('can go back and keeps the entered value', async () => {
    const { w } = await open()
    await field(w, 'onb-hcp').setValue('30')
    await w.find('form').trigger('submit')
    await w.find('[data-testid="onb-back"]').trigger('click')
    expect((field(w, 'onb-hcp').element as HTMLInputElement).value).toBe('30,0')
  })

  it('closing with the X or Escape ends the introduction without data', async () => {
    const a = await open()
    await a.w.find('[data-testid="onb-close"]').trigger('click')
    await flushPromises()
    expect(a.settings.onboardingDone).toBe(true)
    const b = await open()
    await b.w.find('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(b.settings.onboardingDone).toBe(true)
  })

  it('never saves a stale value after invalid input', async () => {
    const { w, settings } = await open()
    await field(w, 'onb-hcp').setValue('24')
    await field(w, 'onb-hcp').setValue('99')
    await field(w, 'onb-hcp').trigger('blur')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(settings.hcp).toBeNull()
  })

  it('warns softly when the goal is above the current handicap', async () => {
    const { w } = await open()
    await field(w, 'onb-hcp').setValue('20')
    await w.find('form').trigger('submit')
    await field(w, 'onb-target').setValue('25')
    expect(w.find('[data-testid="onb-target-warn"]').exists()).toBe(true)
    await field(w, 'onb-target').setValue('15')
    expect(w.find('[data-testid="onb-target-warn"]').exists()).toBe(false)
  })

  it('offers quick goal dates once a goal is set', async () => {
    const { w } = await open()
    await w.find('form').trigger('submit')
    const chip = () => w.findAll('.onb-chip')[1]
    expect((chip().element as HTMLButtonElement).disabled).toBe(true)
    await field(w, 'onb-target').setValue('18')
    await chip().trigger('click')
    expect((field(w, 'onb-date').element as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not show for existing installs', async () => {
    localStorage.setItem('parformance.settings.v1', JSON.stringify({ hcp: 20 }))
    const { w } = await open()
    expect(w.find('dialog').exists()).toBe(false)
  })
})

describe('after the introduction', () => {
  it('highlights the matching row in the targets table once a handicap is set', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const catalog = useDrillCatalogStore()
    await catalog.load()
    const drill = catalog.drills.find(d => d.metric.type === 'streak' && Object.keys(d.metric.hcpTargets).length >= 3) as Drill
    const w = mount(HcpTargetsTable, { props: { drill }, global: { plugins: [pinia] } })
    await flushPromises()
    expect(w.find('[data-testid="hcp-missing"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Du')

    await useSettingsStore().update({ hcp: 24 })
    await flushPromises()
    expect(w.find('[data-testid="hcp-missing"]').exists()).toBe(false)
    expect(w.find('.chip').text()).toBe('Du')
  })

  it('shows a dismissible hint while no handicap is known', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    await settings.update({ onboardingDone: true })
    const w = mount(HcpHint, { global: { plugins: [pinia] } })
    await flushPromises()
    expect(w.find('[data-testid="hcp-hint"]').exists()).toBe(true)
    await w.find('[data-testid="hcp-hint-dismiss"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-testid="hcp-hint"]').exists()).toBe(false)
    expect(settings.hcpHintDismissed).toBe(true)
  })

  it('can replay the introduction from the settings', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.load()
    await settings.update({ onboardingDone: true, hcp: 20 })
    await settings.update({ onboardingDone: false })
    const w = mount(OnboardingModal, { global: { plugins: [pinia] } })
    await flushPromises()
    expect(w.find('dialog').exists()).toBe(true)
  })
})
