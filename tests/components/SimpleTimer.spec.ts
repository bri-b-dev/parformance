import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SimpleTimer from '../../src/components/SimpleTimer.vue'

// We verify that elapsed seconds are emitted when the timer runs,
// and that pause/reset behave correctly.

describe('SimpleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('emits elapsed seconds while running; pauses and resets correctly', async () => {
    const wrapper = mount(SimpleTimer, { props: { presetSeconds: 5 } })

    // Initially, no elapsed emitted
    expect(wrapper.emitted('elapsed')).toBeUndefined()

    // Click Start
    await wrapper.find('button.btn-primary').trigger('click')

    // Advance 3 seconds (use async helper to flush microtasks between ticks)
    await vi.advanceTimersByTimeAsync(3000)
    await nextTick()

    const emits = wrapper.emitted<'elapsed', [number]>('elapsed') || []
    // Expect at least 3 emissions (one per second), last should be 3
    expect(emits.length).toBeGreaterThanOrEqual(3)
    const last = emits[emits.length - 1][0]
    expect(last).toBe(3)

    // Click Pause
    await wrapper.find('button.btn-primary').trigger('click')
    vi.advanceTimersByTime(2000) // should not advance while paused

    const emitsAfterPause = wrapper.emitted<'elapsed', [number]>('elapsed') || []
    const lastAfterPause = emitsAfterPause[emitsAfterPause.length - 1][0]
    expect(lastAfterPause).toBe(3)

    // Reset
    await wrapper.findAll('button').at(1)!.trigger('click')

    const finalEmits = wrapper.emitted<'elapsed', [number]>('elapsed') || []
    const final = finalEmits[finalEmits.length - 1][0]
    expect(final).toBe(0)
  })
})
