import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LevelBadge from '../../src/components/LevelBadge.vue'
import type { Drill, Session } from '../../src/types'
import { useSessionsStore } from '../../src/stores/sessions'
import { useSettingsStore } from '../../src/stores/settings'

const drill: Drill = {
  id: 'chip_carry_zone',
  title: 'Carry Zone',
  category: 'Chipping Green',
  equipment: {},
  setup: { schema: 'x' },
  duration: {},
  instructions: { training: 'x' },
  metric: { type: 'streak', unit: 'Zonen in Serie', hcpTargets: { '54-27': [2,3,4], '26-12': [5,7,9], '11-0': [11,13,15] } },
}

function seedStores({ sessions = [], hcp = 18 }: { sessions?: Session[]; hcp?: number } = {}) {
  const sess = useSessionsStore()
  const sets = useSettingsStore()
  // Seed state and mark as loaded so component's onMounted won't call load()
  sess.sessions = sessions
  ;(sess as any).loaded = true
  sets.hcp = hcp
  ;(sets as any).loaded = true
}

describe('LevelBadge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders neutral when there are no sessions and shows thresholds in tooltip (snapshot)', async () => {
    seedStores({ sessions: [], hcp: 18 })
    const wrapper = mount(LevelBadge, { props: { drill } })
    const badge = wrapper.get('[data-testid="level-badge"]')
    expect(badge.text()).toContain('Level —')
    // Tooltip should mention the HCP bucket and thresholds for 26–12
    const title = badge.attributes('title') || ''
    expect(title).toMatch(/HCP 26–12/)
    expect(title).toMatch(/L1 5/)
    expect(title).toMatch(/L2 7/)
    expect(title).toMatch(/L3 9/)

    // Snapshot of neutral rendering
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders latest level (1–3) when a recent session exists', async () => {
    const sessions: Session[] = [
      { id: 's1', drillId: drill.id, date: '2025-01-01T10:00:00Z', hcp: 18, result: { value: 4, unit: drill.metric.unit }, levelReached: 0 },
      { id: 's2', drillId: drill.id, date: '2025-02-01T10:00:00Z', hcp: 18, result: { value: 8, unit: drill.metric.unit }, levelReached: 2 },
    ]
    seedStores({ sessions, hcp: 18 })

    const wrapper = mount(LevelBadge, { props: { drill } })
    const badge = wrapper.get('[data-testid="level-badge"]')
    expect(badge.text()).toContain('Level 2')
  })
})
