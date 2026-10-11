import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from '@/components/AppIcon.vue'
import CollectionIcon from '@/components/CollectionIcon.vue'
import { COLLECTION_ICON_NAMES, ICONS, ICON_LABELS, isIconName } from '@/components/icons'

describe('icon set', () => {
  it('has an inline svg with a label for every icon and valid markup', () => {
    for (const name of Object.keys(ICONS) as (keyof typeof ICONS)[]) {
      expect(ICON_LABELS[name], name).toBeTruthy()
      expect(ICONS[name]).toMatch(/^<(path|circle|rect|line)/)
      expect(ICONS[name]).not.toMatch(/<script|on\w+=|href=/i)
      const w = mount(AppIcon, { props: { name } })
      expect(w.find('svg').exists()).toBe(true)
      expect(w.find('svg').html()).toContain(ICONS[name].slice(0, 12))
    }
  })

  it('offers only existing icons to collections', () => {
    expect(COLLECTION_ICON_NAMES.length).toBeGreaterThanOrEqual(8)
    expect(COLLECTION_ICON_NAMES.every(isIconName)).toBe(true)
    expect(isIconName('⛳')).toBe(false)
  })

  it('is decorative by default and an image with a name when labeled', () => {
    const deco = mount(AppIcon, { props: { name: 'star' } })
    expect(deco.attributes('aria-hidden')).toBe('true')
    expect(deco.attributes('role')).toBeUndefined()
    const labeled = mount(AppIcon, { props: { name: 'star', label: 'Favorit' } })
    expect(labeled.attributes('role')).toBe('img')
    expect(labeled.attributes('aria-label')).toBe('Favorit')
    expect(labeled.attributes('aria-hidden')).toBeUndefined()
    expect(deco.attributes('stroke')).toBe('currentColor')
  })

  it('draws a collection icon by name and still shows an older emoji as text', () => {
    expect(mount(CollectionIcon, { props: { icon: 'flag' } }).find('svg').exists()).toBe(true)
    const legacy = mount(CollectionIcon, { props: { icon: '⛳' } })
    expect(legacy.find('svg').exists()).toBe(false)
    expect(legacy.text()).toBe('⛳')
    expect(legacy.find('.legacy').attributes('aria-hidden')).toBe('true')
    expect(mount(CollectionIcon, { props: {} }).html()).toBe('<!--v-if-->')
  })
})
