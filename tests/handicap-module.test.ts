import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import HandicapShell from '@/modules/handicap/HandicapShell.vue'
import { handicapRoutes } from '@/modules/handicap/routes'
import { i18n } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

describe('handicap module integration', () => {
  it('renders inside the app: scoped root, translated tabs, calculator route', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/handicap', component: HandicapShell, children: handicapRoutes }],
    })
    await router.push('/handicap')
    await router.isReady()
    const w = mount({ template: '<RouterView />' }, { global: { plugins: [pinia, router, i18n] } })
    await flushPromises()

    expect(w.find('.hc-root').exists()).toBe(true)
    expect(w.findAll('.hc-tab')).toHaveLength(4)
    expect(w.find('.hc-tab').text()).not.toMatch(/^navCalculator$/) // translated, not the raw key
  })

  it('mirrors the app language into vue-i18n', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore()
    await settings.update({ language: 'en' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/handicap', component: HandicapShell, children: handicapRoutes }],
    })
    await router.push('/handicap')
    mount({ template: '<RouterView />' }, { global: { plugins: [pinia, router, i18n] } })
    await flushPromises()
    expect(i18n.global.locale.value).toBe('en')
    await settings.update({ language: 'de' })
    await flushPromises()
    expect(i18n.global.locale.value).toBe('de')
  })
})
