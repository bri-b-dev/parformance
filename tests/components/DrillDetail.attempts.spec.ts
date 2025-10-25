import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DrillDetail from '../../src/components/DrillDetail.vue'
import type { Drill } from '../../src/types'
import { useSessionsStore } from '../../src/stores/sessions'

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

const countInTimeDrill: Drill = {
  id: 'putt_count_60s',
  title: '60s Count',
  category: 'Putting Green',
  equipment: { balls: 3, clubs: ['Putter'] },
  setup: { schema: 'Zielzone 1 m Radius', location: 'Putting Green' },
  duration: { suggestedMin: 5, timerPreset: 60 },
  instructions: { training: 'Innerhalb 60s so viele Putts wie möglich lochen.' },
  metric: { type: 'count_in_time', unit: 'Treffer in 60s', hcpTargets: { '54-27': [2,3,4] } },
}

function mountDetail() {
  return mount(DrillDetail, {
    props: { drill: countInTimeDrill },
    global: { plugins: [createPinia()] },
  })
}

describe('DrillDetail: Optional increment button for count_in_time stores attempts on save', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // @ts-expect-error assign global
    global.window = { localStorage: new LocalStorageMock(), dispatchEvent: () => {} }
    vi.useFakeTimers()
  })

  it('increments attempts during active session and persists attempts on save', async () => {
    const wrapper = mountDetail()

    // Start session
    const startBtn = wrapper.get('button.btn-primary')
    await startBtn.trigger('click')

    // Increment attempts 3 times
    const incBtn = wrapper.get('[data-testid="attempts-inc"]')
    await incBtn.trigger('click')
    await incBtn.trigger('click')
    await incBtn.trigger('click')

    // Ensure chip updates
    expect(wrapper.get('[data-testid="attempts-chip"]').text()).toContain('3')

    // Enter a valid result value (> 0)
    const numberInput = wrapper.get('input[type="number"]')
    await numberInput.setValue('5')

    // Save
    const saveBtn = wrapper.get('button.btn-primary')
    // after starting, the primary button label is "Speichern"
    await saveBtn.trigger('click')

    // Debounced persist may be scheduled; but we only need to inspect store state
    const sessions = useSessionsStore()
    expect(sessions.sessions.length).toBe(1)
    const s = sessions.sessions[0]
    expect(s.drillId).toBe(countInTimeDrill.id)
    expect(s.attempts).toBe(3)
    expect(s.result.value).toBe(5)
    expect(s.result.unit).toBe(countInTimeDrill.metric.unit)
  })
})
