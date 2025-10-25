import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GamerPanel from '../../src/components/GamerPanel.vue'

describe('GamerPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders collapsed by default and matches snapshot', async () => {
    const wrapper = mount(GamerPanel, { props: { drillId: 'test-drill' } })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('toggles open with keyboard and traps focus', async () => {
    const wrapper = mount(GamerPanel, { props: { drillId: 'test-drill' }, attachTo: document.body })
    const btn = wrapper.get('button.panel-toggle')
  // open via Enter (do not also click, that would toggle it closed)
  await btn.trigger('keydown.enter')
  // wait for DOM updates and the focus-trap to attach
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  // now panel body should be present
  expect(wrapper.find('.panel-body').exists()).toBe(true)
    // get focusable elements
    const inputs = wrapper.element.querySelectorAll('button, input, select')
    expect(inputs.length).toBeGreaterThan(0)
    // simulate Tab cycling from last to first
    const first = inputs[0] as HTMLElement
    const last = inputs[inputs.length - 1] as HTMLElement
  last.focus()
  const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
  document.dispatchEvent(e)
    // after dispatch, focus should be on first
    expect(document.activeElement).toBe(first)
  })
})
