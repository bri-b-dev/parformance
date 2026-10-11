import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DrillDetailView from '@/views/DrillDetailView.vue'
import SettingsForm from '@/components/settings/SettingsForm.vue'
import { useDrillCatalogStore } from '@/stores/drillCatalog'

const Stub = { template: '<div />' }

describe('drill not found', () => {
  it('shows a proper card with the id and a way back (the markup was broken before)', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/drills', name: 'DrillsList', component: Stub }, { path: '/drill/:id', name: 'DrillDetail', component: DrillDetailView, props: true }],
    })
    await router.push('/drill/gibt-es-nicht')
    await useDrillCatalogStore().load()
    const w = mount({ template: '<RouterView />' }, { global: { plugins: [pinia, router] } })
    await flushPromises()
    const card = w.find('[data-testid="drill-not-found"]')
    expect(card.exists()).toBe(true)
    expect(card.attributes('role')).toBe('status')
    expect(card.text()).toContain('Drill nicht gefunden')
    expect(card.text()).toContain('gibt-es-nicht')
    expect(card.find('a').text()).toBe('Zurück zur Liste')
  })
})

describe('settings reset button', () => {
  it('is a danger action styled from tokens and asks the parent to reset', async () => {
    const w = mount(SettingsForm)
    const btn = w.find('[data-testid="reset-all"]')
    expect(btn.classes()).toContain('btn-danger')
    await btn.trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })
})
