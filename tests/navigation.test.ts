import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import BottomTabs from '@/components/BottomTabs.vue'
import BrandMark from '@/components/BrandMark.vue'
import { routes } from '@/router'
import { useUiStore } from '@/stores/ui'

const Stub = { template: '<div />' }

function makeRouter() {
  // reuse the real route table (names, redirects) with stub components
  const stubbed = routes.map(r => ({ ...r, component: r.component ? Stub : undefined, children: undefined }))
  return createRouter({ history: createMemoryHistory(), routes: stubbed as any })
}

describe('bottom navigation', () => {
  it('shows Drills, Handicap, Fortschritt and a central shuffle button', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/drills')
    const w = mount(BottomTabs, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(w.findAll('a.tab').map(a => a.text())).toEqual(['Drills', 'Handicap', 'Fortschritt'])
    expect(w.find('a.tab.active').text()).toBe('Drills')
    expect(w.find('a.tab.active').attributes('aria-current')).toBe('page')

    await w.find('.tab-fab').trigger('click')
    await flushPromises()
    expect(useUiStore().shuffleOpen).toBe(true)
  })

  it('marks Handicap and Fortschritt as active on their routes', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    const w = mount(BottomTabs, { global: { plugins: [pinia, router] } })
    await router.push('/handicap')
    await flushPromises()
    expect(w.find('a.tab.active').text()).toBe('Handicap')
    await router.push('/progress')
    await flushPromises()
    expect(w.find('a.tab.active').text()).toBe('Fortschritt')
  })

  it('redirects the old /history link to /progress', async () => {
    const router = makeRouter()
    await router.push('/history')
    expect(router.currentRoute.value.path).toBe('/progress')
  })
})

describe('brand mark', () => {
  it('renders an accessible inline svg using the theme color', () => {
    const w = mount(BrandMark)
    expect(w.find('svg').attributes('aria-label')).toBe('ParFormance')
    expect(w.html()).toContain('currentColor')
  })
})
