import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import OnboardingModal from '@/components/OnboardingModal.vue'
import { useSettingsStore } from '@/stores/settings'

describe('onboarding', () => {
  it('is shown on first run and saves hcp and goal', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const w = mount(OnboardingModal)
    await flushPromises()
    expect(w.find('dialog').exists()).toBe(true)

    await w.find('#onb-hcp').setValue(24.5)
    await w.find('#onb-target').setValue(18)
    await w.find('#onb-date').setValue('2027-06-01')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(settings.hcp).toBe(24.5)
    expect(settings.targetHcp).toBe(18)
    expect(settings.targetDate).toBe('2027-06-01')
    expect(settings.onboardingDone).toBe(true)
    expect(w.find('dialog').exists()).toBe(false)
  })

  it('can be skipped without data', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const w = mount(OnboardingModal)
    await flushPromises()
    await w.findAll('button').find(b => b.text() === 'Überspringen')!.trigger('click')
    await flushPromises()
    expect(settings.onboardingDone).toBe(true)
    expect(settings.hcp).toBeNull()
  })

  it('rejects out-of-range handicaps', async () => {
    const settings = useSettingsStore()
    await settings.load()
    const w = mount(OnboardingModal)
    await flushPromises()
    await w.find('#onb-hcp').setValue(80)
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(settings.onboardingDone).toBe(false)
  })

  it('does not show for existing installs', async () => {
    localStorage.setItem('parformance.settings.v1', JSON.stringify({ hcp: 20 }))
    const settings = useSettingsStore()
    await settings.load()
    const w = mount(OnboardingModal)
    await flushPromises()
    expect(w.find('dialog').exists()).toBe(false)
  })
})
