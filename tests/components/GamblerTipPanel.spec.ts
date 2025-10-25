import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GamblerTipPanel from '../../src/components/GamblerTipPanel.vue'
import { useUiStore } from '../../src/stores/ui'

describe('GamblerTipPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders collapsed by default and matches snapshot', async () => {
    const wrapper = mount(GamblerTipPanel, { props: { drillId: 'd1', tip: 'Risk it' } })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('toggles and preserves state in UI store during session', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const ui = useUiStore()
    const wrapper = mount(GamblerTipPanel, { props: { drillId: 'd2', tip: 'Try a draw' }, global: { plugins: [pinia] } })
    const btn = wrapper.get('button')
    // initially collapsed
    expect(ui.isGamblerCollapsed('d2')).toBe(true)
    await btn.trigger('click')
    expect(ui.isGamblerCollapsed('d2')).toBe(false)
    // snapshot open
    expect(wrapper.html()).toMatchSnapshot()
  })
})
