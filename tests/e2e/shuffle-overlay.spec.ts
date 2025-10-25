import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { makeRouter } from '../../src/router'
import { createMemoryHistory } from 'vue-router'
import RandomizerView from '../../src/views/RandomizerView.vue'

// This E2E-style test verifies the overlay reels run sequentially and then navigate to Drill Detail

describe('Shuffle Overlay: 3 reels animate and navigate to Drill Detail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('start → sequential stop → navigates to /drill/:id', async () => {
    const router = makeRouter(createMemoryHistory())
    await router.push('/shuffle')
    await router.isReady()

    const wrapper = mount(RandomizerView, {
      global: { plugins: [router] },
    })

    // Wait for onMounted load of catalog
    await Promise.resolve()

    // Click Start
    const startBtn = wrapper.get('[data-testid="shuffle-start"]')
    await startBtn.trigger('click')

    // Advance timers enough for all three sequential stops (600 + 700 + 500) plus margins
    await vi.advanceTimersByTimeAsync(2100)

    // Router should have navigated to Drill Detail route
    expect(router.currentRoute.value.name).toBe('DrillDetail')
    const id = router.currentRoute.value.params.id as string
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
})
