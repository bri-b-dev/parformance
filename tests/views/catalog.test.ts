import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DrillList from '@/components/DrillList.vue'
import DrillCard from '@/components/DrillCard.vue'
import { SCROLL_RESTORE_DELAY_MS, makeRouter } from '@/router'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import type { Drill } from '@/types'

const Stub = { template: '<div />' }
const q = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-testid="${id}"]`)
const qa = (w: ReturnType<typeof mount>, id: string) => w.findAll(`[data-testid="${id}"]`)

async function open(url = '/drills', prep?: (stores: { catalog: ReturnType<typeof useDrillCatalogStore> }) => Promise<void>) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/drills', name: 'DrillsList', component: DrillList },
      { path: '/drill/:id', name: 'DrillDetail', component: Stub },
      { path: '/collections', name: 'Collections', component: Stub },
    ] as never,
  })
  await router.push(url)
  const catalog = useDrillCatalogStore()
  await catalog.load()
  await useSettingsStore().load()
  await prep?.({ catalog })
  const w = mount({ template: '<RouterView />' }, { attachTo: document.body, global: { plugins: [pinia, router] } })
  await router.isReady()
  await flushPromises()
  return { w, router, catalog, ui: useUiStore() }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('catalog list', () => {
  it('groups all drills under sticky category headings and counts them', async () => {
    const { w, catalog } = await open()
    expect(q(w, 'result-count').text()).toBe(`${catalog.drills.length} von ${catalog.drills.length} Drills`)
    const groups = qa(w, 'catalog-group')
    expect(groups.length).toBeGreaterThan(5)
    expect(groups.every(g => g.find('h2.cat-head').exists())).toBe(true)
    const names = groups.map(g => g.find('h2').text().replace(/\s*\d+$/, ''))
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'de')))
    expect(w.findAll('article.drill-card')).toHaveLength(catalog.drills.length)
  })

  it('searches while typing (debounced) and writes the term to the URL', async () => {
    vi.useFakeTimers()
    const { w, router, catalog } = await open()
    await q(w, 'catalog-search').setValue('bunker')
    expect(router.currentRoute.value.query.q).toBeUndefined() // not yet
    vi.advanceTimersByTime(250)
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('bunker')
    const n = w.findAll('article.drill-card').length
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThan(catalog.drills.length)
    expect(q(w, 'result-count').text()).toContain(`${n} von`)
  })

  it('applies a search immediately on Enter and finds umlauts typed as ue', async () => {
    const { w, router } = await open()
    await q(w, 'catalog-search').setValue('ueben')
    await q(w, 'catalog-search').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('ueben')
  })

  it('restores the whole filter state from the URL', async () => {
    const { w } = await open('/drills?q=putt&cat=Putting&dur=20&diff=mid&fav=1')
    expect((q(w, 'catalog-search').element as HTMLInputElement).value).toBe('putt')
    expect(qa(w, 'active-chip').map(c => c.text())).toEqual(['Putting ✕', 'bis 20 Min. ✕', 'Mittel (3) ✕', 'Favoriten ✕'])
    expect(q(w, 'filter-badge').text()).toBe('4')
    expect(q(w, 'catalog-empty').exists()).toBe(true) // no favorites yet
  })

  it('removes a single filter with its chip and resets everything', async () => {
    const { w, router } = await open('/drills?cat=Putting&dur=20&q=kreis')
    await qa(w, 'active-chip')[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.cat).toBeUndefined()
    expect(router.currentRoute.value.query.dur).toBe('20')
    await q(w, 'chips-reset').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
    expect((q(w, 'catalog-search').element as HTMLInputElement).value).toBe('')
    expect(q(w, 'active-chips').exists()).toBe(false)
  })

  it('offers "Filter zurücksetzen" when nothing matches', async () => {
    const { w, router, catalog } = await open('/drills?q=zzzzzz')
    expect(q(w, 'catalog-empty').text()).toContain('Keine Drills gefunden')
    expect(q(w, 'result-count').text()).toBe(`0 von ${catalog.drills.length} Drills`)
    await q(w, 'empty-reset').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
    expect(w.findAll('article.drill-card').length).toBe(catalog.drills.length)
  })

  it('keeps other query parameters when the filter changes', async () => {
    const { w, router } = await open('/drills?ref=abc')
    await q(w, 'filter-open').trigger('click')
    await w.find('[aria-labelledby="fs-dur"] .fchip').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ ref: 'abc', dur: '10' })
  })

  it('shows the filter back after visiting a drill and going back', async () => {
    const { w, router } = await open('/drills?cat=Putting&q=kreis')
    const link = w.find('article.drill-card a.card-title')
    await link.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('DrillDetail')
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ cat: 'Putting', q: 'kreis' })
    expect(qa(w, 'active-chip').map(c => c.text())).toEqual(['Putting ✕'])
    expect((q(w, 'catalog-search').element as HTMLInputElement).value).toBe('kreis')
  })

  it('feeds the category and tag to the shuffle overlay', async () => {
    const { ui } = await open('/drills?cat=Bunker&tag=Druck')
    expect(ui.activeCategory).toBe('Bunker')
    expect(ui.activeTag).toBe('Druck')
  })
})

describe('filter sheet', () => {
  it('opens as a dialog, filters live, shows the count and returns the focus on close', async () => {
    const { w, router } = await open()
    const opener = q(w, 'filter-open')
    ;(opener.element as HTMLElement).focus()
    await opener.trigger('click')
    const dialog = w.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(opener.attributes('aria-expanded')).toBe('true')

    await w.find('[aria-labelledby="fs-cat"] .fchip').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.cat).toBeTruthy()
    expect(q(w, 'fs-apply').text()).toMatch(/^\d+ Drills? anzeigen$/)
    expect(q(w, 'filter-badge').text()).toBe('1')

    await dialog.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(opener.element)
  })

  it('selects tags (top tags first, all on demand) and the other filters', async () => {
    const { w, router } = await open()
    await q(w, 'filter-open').trigger('click')
    const initial = w.findAll('[data-testid="fs-tags"] .fchip').length
    expect(initial).toBe(12)
    await q(w, 'fs-more-tags').trigger('click')
    expect(w.findAll('[data-testid="fs-tags"] .fchip').length).toBeGreaterThan(12)
    await w.find('[data-testid="fs-tags"] .fchip').trigger('click')
    await w.find('[aria-labelledby="fs-diff"] .fchip').trigger('click')
    await w.find('[aria-labelledby="fs-place"] .fchip').trigger('click')
    await q(w, 'fs-new').setValue(true)
    await flushPromises()
    expect(Object.keys(router.currentRoute.value.query).sort()).toEqual(['diff', 'new', 'place', 'tag'])
    await q(w, 'fs-reset').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('"Unter Ziel" needs a handicap; with one it narrows to the drills below target', async () => {
    const a = await open()
    await q(a.w, 'filter-open').trigger('click')
    expect((q(a.w, 'fs-low').element as HTMLInputElement).disabled).toBe(true)
    expect(a.w.text()).toContain('dafür brauchen wir dein Handicap')
    document.body.innerHTML = ''

    const b = await open('/drills?low=1', async ({ catalog }) => {
      const settings = useSettingsStore()
      await settings.update({ hcp: 20, targetHcp: 5 })
      const sessions = useSessionsStore()
      await sessions.load()
      const d = catalog.drills.find(x => x.id === 'putting_circle')!
      await sessions.addSession({ drillId: d.id, date: new Date().toISOString(), hcp: 20, result: { value: 1, unit: d.metric.unit } })
    })
    expect(b.w.findAll('article.drill-card').map(c => c.find('.card-title').text())).toEqual(['Circle Putting'])
    expect(qa(b.w, 'active-chip')[0].text()).toBe('Unter Ziel ✕')
  })

  it('"Nur Favoriten" is disabled without favorites and works with them', async () => {
    const a = await open()
    await q(a.w, 'filter-open').trigger('click')
    expect((q(a.w, 'fs-fav').element as HTMLInputElement).disabled).toBe(true)
    document.body.innerHTML = ''

    const b = await open('/drills?fav=1', async ({ catalog }) => {
      const favs = useFavoritesStore()
      await favs.load()
      await favs.toggle(catalog.drills[3].id)
      await new Promise(r => setTimeout(r, 320)) // favorites are persisted with a short delay
    })
    expect(b.w.findAll('article.drill-card')).toHaveLength(1)
    expect(b.w.find('article.drill-card .card-title').text()).toBe(b.catalog.drills[3].title)
  })
})

describe('drill card', () => {
  const drill = (extra: Record<string, unknown> = {}) => ({
    id: 'c', title: 'Kreis', category: 'Putting', summary: 'Kurz', tags: ['4m'], duration: { hardStop: 15 }, difficulty: { base: 4, scale: '1-5' },
    setup: { schema: '', diagram: 'svg:drills/putting_circle' }, instructions: { training: '' }, metric: { type: 'streak', unit: 'x', hcpTargets: {} }, ...extra,
  }) as unknown as Drill

  async function card(d: Drill) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Stub }, { path: '/drill/:id', name: 'DrillDetail', component: Stub }] })
    await router.push('/')
    const w = mount(DrillCard, { props: { drill: d }, global: { plugins: [pinia, router] } })
    await flushPromises()
    return w
  }

  it('shows duration, difficulty dots, level badge and tags', async () => {
    const w = await card(drill())
    expect(q(w, 'card-minutes').text()).toBe('15 Min.')
    expect(w.text()).toContain('●●●●○')
    expect(w.find('[data-testid="level-stars"]').exists()).toBe(true)
    expect(w.text()).toContain('4m')
    expect(w.find('a.card-title').attributes('href')).toBe('/drill/c')
  })

  it('loads the diagram as an inline thumbnail with unique ids', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, text: async () => '<svg viewBox="0 0 10 10"><defs><marker id="arrow"/></defs><path marker-end="url(#arrow)"/></svg>' }))
    const w = await card(drill({ id: 'thumb-1', setup: { schema: '', diagram: 'svg:drills/some_unique_diagram' } }))
    await flushPromises()
    const html = q(w, 'drill-thumb').html()
    expect(html).toContain('<svg')
    expect(html).not.toContain('id="arrow"')
    expect(html).toMatch(/url\(#t\d+-[a-z0-9]+-arrow\)/)
    expect(q(w, 'drill-thumb').attributes('aria-hidden')).toBe('true')
  })

  it('shows a quiet placeholder when the diagram cannot be loaded', async () => {
    const w = await card(drill({ setup: { schema: '', diagram: 'svg:drills/missing_one' } }))
    await flushPromises()
    expect(q(w, 'drill-thumb').find('svg').exists()).toBe(false)
    expect(q(w, 'drill-thumb').find('.thumb-ph').exists()).toBe(true)
  })
})

describe('scroll position and layout', () => {
  it('restores the saved position after the page transition and starts new pages at the top', async () => {
    vi.useFakeTimers()
    const router = makeRouter(createMemoryHistory())
    const behavior = router.options.scrollBehavior as (to: unknown, from: unknown, saved: unknown) => unknown
    expect(behavior({}, {}, null)).toEqual({ top: 0 })
    const result = behavior({}, {}, { left: 0, top: 640 }) as Promise<unknown>
    let resolved: unknown
    void result.then(v => { resolved = v })
    await vi.advanceTimersByTimeAsync(SCROLL_RESTORE_DELAY_MS - 20)
    expect(resolved).toBeUndefined()
    await vi.advanceTimersByTimeAsync(40)
    expect(resolved).toEqual({ left: 0, top: 640 })
  })

  it('waits longer than the page transition in App.vue', () => {
    const app = readFileSync('src/App.vue', 'utf8')
    const ms = Number(/transition: all ([\d.]+)s/.exec(app)?.[1]) * 1000
    expect(SCROLL_RESTORE_DELAY_MS).toBeGreaterThan(ms)
  })

  it('does not make <main> an overflow container (sticky bars would never stick)', () => {
    const css = readFileSync('src/assets/theme.css', 'utf8')
    const block = /\nmain \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(block).toMatch(/overflow:\s*visible/)
    expect(block).not.toMatch(/overflow:\s*(auto|scroll|hidden)/)
  })
})

describe('fast changes', () => {
  it('does not lose a filter when two are changed before the URL has updated', async () => {
    const { w, router } = await open()
    await q(w, 'filter-open').trigger('click')
    // no await between the clicks: both build on each other
    w.find('[aria-labelledby="fs-diff"] .fchip').trigger('click')
    w.find('[aria-labelledby="fs-place"] .fchip').trigger('click')
    await flushPromises()
    expect(Object.keys(router.currentRoute.value.query).sort()).toEqual(['diff', 'place'])
  })
})
