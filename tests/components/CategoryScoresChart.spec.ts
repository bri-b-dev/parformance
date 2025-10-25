import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryScoresChart from '../../src/components/CategoryScoresChart.vue'

const scores = {
  'Putting Green': 100,
  'Chipping Green': 33,
  'Driving Range': 67,
}

describe('CategoryScoresChart', () => {
  it('renders bar chart with labels, values, and highlights weakest', async () => {
    const wrapper = mount(CategoryScoresChart, { props: { scores, title: 'Scores', mode: 'bar' } })

    // Labels and values
    expect(wrapper.text()).toContain('Putting Green')
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.text()).toContain('Chipping Green')
    expect(wrapper.text()).toContain('33%')

    // Weakest is Chipping Green (33). The bar should have red background (#ef4444)
    const bar = wrapper.get('[data-testid="bar-Chipping Green"]')
    const style = (bar.element as HTMLElement).getAttribute('style') || ''
    const normalized = style.replace(/\s+/g, ' ')
    expect(
      normalized.includes('background: rgb(239, 68, 68)') ||
      normalized.includes('background: #ef4444') ||
      normalized.includes('background:#ef4444')
    ).toBe(true)

    // SR summary present
    const sr = wrapper.find('p.sr-only')
    expect(sr.exists()).toBe(true)
    expect(sr.text()).toMatch(/Schwächste Kategorie: Chipping Green/)

    // Snapshot of bar variant
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders radar chart with polygon and marker on weakest point', async () => {
    const wrapper = mount(CategoryScoresChart, { props: { scores, title: 'Scores', mode: 'radar' } })

    // Has an SVG and a polygon
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('polygon').exists()).toBe(true)

    // Weakest point marker exists (red circle)
    const marker = wrapper.find('circle[fill="#ef4444"]')
    expect(marker.exists()).toBe(true)

    // Snapshot of radar variant
    expect(wrapper.html()).toMatchSnapshot()
  })
})
