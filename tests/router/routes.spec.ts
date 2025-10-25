import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { withPreservedQuery } from '../../src/router'

// Create stub components to avoid SFC parsing in unit tests
const Stub = { template: '<div />' }

function makeTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: { name: 'DrillsList' } },
      { name: 'DrillsList', path: '/drills', component: Stub },
      { name: 'DrillDetail', path: '/drill/:id', component: Stub, props: true },
      { name: 'Stats', path: '/stats', component: Stub },
      { name: 'ShuffleOverlay', path: '/shuffle', component: Stub },
    ],
  })
}

describe('App routes', () => {
  it('deep links to /drill/:id and parses id param', async () => {
    const router = makeTestRouter()
    await router.push('/drill/chip_carry_zone')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('DrillDetail')
    expect(router.currentRoute.value.params.id).toBe('chip_carry_zone')
  })

  it('preserves filters via query params when navigating between list and detail', async () => {
    const router = makeTestRouter()

    // Start on drills list with some filters in the query
    await router.push({ name: 'DrillsList', query: { cat: 'Chipping Green', tag: 'Kontakt' } })
    await router.isReady()

    const from = router.currentRoute.value

    // Navigate to detail while preserving the query
    const toDetail = withPreservedQuery({ name: 'DrillDetail', params: { id: 'chip_carry_zone' } }, from)
    await router.push(toDetail)

    const detail = router.currentRoute.value
    expect(detail.name).toBe('DrillDetail')
    expect(detail.params.id).toBe('chip_carry_zone')
    expect(detail.query).toMatchObject({ cat: 'Chipping Green', tag: 'Kontakt' })

    // Navigate back to list, preserving the same filters
    const backToList = withPreservedQuery({ name: 'DrillsList' }, detail)
    await router.push(backToList)

    const list = router.currentRoute.value
    expect(list.name).toBe('DrillsList')
    expect(list.query).toMatchObject({ cat: 'Chipping Green', tag: 'Kontakt' })
  })
})
