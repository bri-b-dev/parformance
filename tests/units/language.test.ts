import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import HeaderBar from '@/components/HeaderBar.vue'
import { i18n } from '@/i18n'

afterEach(() => { i18n.global.locale.value = 'de' })

describe('language switch', () => {
  it('re-renders without restart', async () => {
    const w = mount(HeaderBar)
    expect(w.find('button[aria-label]').attributes('aria-label')).toBe('Einstellungen')
    i18n.global.locale.value = 'en'
    await w.vm.$nextTick()
    expect(w.find('button[aria-label]').attributes('aria-label')).toBe('Settings')
  })
})
