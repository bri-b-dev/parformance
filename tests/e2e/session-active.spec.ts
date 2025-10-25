import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DrillDetail from '../../src/components/DrillDetail.vue'
import type { Drill } from '../../src/types'
import { createPinia, setActivePinia } from 'pinia'

class LocalStorageMock {
  store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = value }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
  key(i: number) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

declare global { var window: any }

const sampleDrill: Drill = {
  id: 'chip_carry_zone',
  title: 'Carry Zone',
  category: 'Chipping Green',
  equipment: { balls: 6, clubs: ['Wedge'] },
  setup: { schema: '6 Landebänder im Meterabstand', location: 'Chipping Green' },
  duration: { suggestedMin: 5, timerPreset: 300 },
  instructions: { training: 'Abwechselnd kurz→lang die Carry-Zonen treffen.' },
  metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: { '54-27': [2,3,4] } },
}

function mountDetail() {
  return mount(DrillDetail, {
    props: { drill: sampleDrill },
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('E2E: start timer (if preset), enable inputs, mark session as active until save', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Preserve jsdom window and patch only required fields
    Object.assign(global.window, { localStorage: new LocalStorageMock(), dispatchEvent: () => {} })
    vi.useFakeTimers()
  })

  it('start → cancel toggles active state and input enabled/disabled', async () => {
    const wrapper = mountDetail()

    // Initially: input disabled, no active chip
    const numberInput = () => wrapper.find('input[type="number"]')
    expect(numberInput().exists()).toBe(true)
    expect((numberInput().element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.text()).not.toContain('Aktiv')

    // Click Start
    const startBtn = wrapper.findAll('button').find(b => /Session starten/i.test(b.text()))!
    await startBtn.trigger('click')
    await Promise.resolve()

    // Now: active chip visible, input enabled
    expect(wrapper.text()).toContain('Aktiv')
    expect((numberInput().element as HTMLInputElement).disabled).toBe(false)

    // Click Cancel
    // Click explicit "Abbrechen" button to avoid matching other .btn elements
    const cancelBtn = wrapper.findAll('button').find(b => /Abbrechen/i.test(b.text()))!
    await cancelBtn.trigger('click')
    await Promise.resolve()

    // Back to initial state
    expect(wrapper.text()).not.toContain('Aktiv')
    expect((numberInput().element as HTMLInputElement).disabled).toBe(true)
  })
})
