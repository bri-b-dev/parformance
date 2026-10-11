import { describe, expect, it } from 'vitest'
import drills from '@/data/drills.json'
import {
  activeChips, allTags, clearKey, diagramUrl, EMPTY_FILTER, filterCatalog, filterToQuery, groupByCategory, isFiltered,
  matchesQuery, parseFilter, searchForms, type CatalogFilter, type FilterContext,
} from '@/filters/catalog'
import { scopeSvgIds } from '@/utils/svgIds'
import type { Drill } from '@/types'

const catalog = drills as unknown as Drill[]
const ctx = (over: Partial<FilterContext> = {}): FilterContext => ({ favorites: new Set(), played: new Set(), belowTarget: new Set(), ...over })
const f = (over: Partial<CatalogFilter> = {}): CatalogFilter => ({ ...EMPTY_FILTER, ...over })

const mk = (id: string, over: Partial<Drill> & { minutes?: number; base?: number; location?: string } = {}): Drill => ({
  id, title: id, category: 'Putting', tags: [], summary: '', duration: { hardStop: over.minutes ?? 10 },
  difficulty: { base: over.base ?? 3, scale: '1-5' }, setup: { schema: '', location: over.location ?? 'Putting Green' },
  instructions: { training: '' }, metric: { type: 'streak', unit: 'x', hcpTargets: {} }, ...over,
}) as unknown as Drill

describe('URL <-> filter', () => {
  it('round-trips every field and keeps the URL short', () => {
    const full = f({ q: 'Kreis', category: 'Putting', tag: '4m', maxMinutes: 20, difficulty: 'hard', place: 'Range', favorites: true, unplayed: true, belowTarget: true })
    const query = filterToQuery(full)
    expect(query).toEqual({ q: 'Kreis', cat: 'Putting', tag: '4m', dur: '20', diff: 'hard', place: 'Range', fav: '1', new: '1', low: '1' })
    expect(parseFilter(query)).toEqual(full)
    expect(filterToQuery(EMPTY_FILTER)).toEqual({})
    expect(parseFilter({})).toEqual(EMPTY_FILTER)
  })

  it('ignores invalid values and takes the first of repeated keys', () => {
    expect(parseFilter({ dur: '15', diff: 'extreme', place: 'Mars', fav: '0', new: 'yes' })).toEqual(EMPTY_FILTER)
    expect(parseFilter({ cat: ['Putting', 'Bunker'], q: ['  hallo  '] })).toMatchObject({ category: 'Putting', q: 'hallo' })
  })
})

describe('search', () => {
  it('finds umlauts with and without transliteration', () => {
    expect(searchForms('Für').sort()).toEqual(['fuer', 'fur'].sort())
    const d = mk('x', { title: 'Üben für Fortgeschrittene' })
    for (const q of ['fuer', 'für', 'fur', 'ueben', 'üben', 'uben', 'FÜR']) expect(matchesQuery(d, q), q).toBe(true)
    expect(matchesQuery(mk('y', { title: 'Straße' }), 'strasse')).toBe(true)
    expect(matchesQuery(d, 'bunker')).toBe(false)
  })

  it('looks in title, tags, summary and category and needs every word', () => {
    const d = mk('x', { title: 'Comfort Zone', category: 'Putting', tags: ['Druck', 'Serienübung'], summary: 'Kurze Putts lochen' })
    expect(matchesQuery(d, 'comfort')).toBe(true)
    expect(matchesQuery(d, 'druck')).toBe(true)
    expect(matchesQuery(d, 'serienuebung')).toBe(true)
    expect(matchesQuery(d, 'lochen kurze')).toBe(true)
    expect(matchesQuery(d, 'putting')).toBe(true)
    expect(matchesQuery(d, 'comfort bunker')).toBe(false)
    expect(matchesQuery(d, '   ')).toBe(true)
  })

  it('finds real catalog drills by tag and by transliterated word', () => {
    expect(catalog.filter(d => matchesQuery(d, 'druck')).length).toBeGreaterThan(0)
    expect(filterCatalog(catalog, f({ q: 'putt' }), ctx()).length).toBeGreaterThan(5)
  })
})

describe('filterCatalog', () => {
  const list = [
    mk('a', { category: 'Putting', tags: ['4m'], minutes: 5, base: 1, location: 'Putting Green' }),
    mk('b', { category: 'Chipping', tags: ['9m', '4m'], minutes: 15, base: 3, location: 'Chipping Green' }),
    mk('c', { category: 'Bunker', tags: [], minutes: 30, base: 5, location: 'Übungsbunker' }),
  ]
  const ids = (flt: Partial<CatalogFilter>, c = ctx()) => filterCatalog(list, f(flt), c).map(d => d.id)

  it('filters by category, tag, duration, difficulty and place', () => {
    expect(ids({ category: 'Chipping' })).toEqual(['b'])
    expect(ids({ tag: '4m' })).toEqual(['a', 'b'])
    expect(ids({ maxMinutes: 10 })).toEqual(['a'])
    expect(ids({ maxMinutes: 20 })).toEqual(['a', 'b'])
    expect(ids({ difficulty: 'easy' })).toEqual(['a'])
    expect(ids({ difficulty: 'mid' })).toEqual(['b'])
    expect(ids({ difficulty: 'hard' })).toEqual(['c'])
    expect(ids({ place: 'Bunker' })).toEqual(['c'])
  })

  it('filters by favorites, never played and below target', () => {
    expect(ids({ favorites: true }, ctx({ favorites: new Set(['b']) }))).toEqual(['b'])
    expect(ids({ unplayed: true }, ctx({ played: new Set(['a', 'b']) }))).toEqual(['c'])
    expect(ids({ belowTarget: true }, ctx({ belowTarget: new Set(['a', 'c']) }))).toEqual(['a', 'c'])
  })

  it('combines filters (AND)', () => {
    expect(ids({ tag: '4m', maxMinutes: 10, difficulty: 'easy' })).toEqual(['a'])
    expect(ids({ tag: '4m', category: 'Bunker' })).toEqual([])
  })
})

describe('chips, groups and tags', () => {
  it('lists active filters (not the search text) and can clear one', () => {
    const flt = f({ q: 'x', category: 'Putting', maxMinutes: 10, favorites: true })
    expect(activeChips(flt).map(c => c.label)).toEqual(['Putting', 'bis 10 Min.', 'Favoriten'])
    expect(clearKey(flt, 'category').category).toBe('')
    expect(clearKey(flt, 'favorites').favorites).toBe(false)
    expect(isFiltered(f({ q: 'x' }))).toBe(true)
    expect(isFiltered(EMPTY_FILTER)).toBe(false)
  })

  it('groups by category sorted, drills by title', () => {
    const g = groupByCategory([mk('z', { title: 'Zebra', category: 'Putting' }), mk('a', { title: 'Alpha', category: 'Putting' }), mk('b', { title: 'Beta', category: 'Bunker' })])
    expect(g.map(x => x.category)).toEqual(['Bunker', 'Putting'])
    expect(g[1].drills.map(d => d.title)).toEqual(['Alpha', 'Zebra'])
  })

  it('counts tags, most used first', () => {
    const t = allTags([mk('a', { tags: ['x', 'y'] }), mk('b', { tags: ['y'] }), mk('c', { tags: ['y', 'x', 'z'] })])
    expect(t).toEqual([{ tag: 'y', count: 3 }, { tag: 'x', count: 2 }, { tag: 'z', count: 1 }])
  })

  it('derives the diagram path', () => {
    expect(diagramUrl(mk('a', { setup: { schema: '', diagram: 'svg:drills/foo' } } as never))).toBe('/drills/foo.svg')
    expect(diagramUrl(mk('a', { setup: { schema: '', diagram: 'svg:/drills/foo.svg' } } as never))).toBe('/drills/foo.svg')
    expect(diagramUrl(mk('a', { setup: { schema: '' } } as never))).toBeNull()
    expect(catalog.every(d => diagramUrl(d))).toBe(true)
  })
})

describe('scopeSvgIds', () => {
  it('prefixes ids and every reference', () => {
    const svg = '<svg><defs><marker id="arrow"/><linearGradient id="g"/></defs><path marker-end="url(#arrow)" fill="url(#g)"/><use href="#arrow"/><use xlink:href="#g"/></svg>'
    const out = scopeSvgIds(svg, 't1')
    expect(out).toContain('id="t1-arrow"')
    expect(out).toContain('marker-end="url(#t1-arrow)"')
    expect(out).toContain('fill="url(#t1-g)"')
    expect(out).toContain('href="#t1-arrow"')
    expect(out).toContain('xlink:href="#t1-g"')
    expect(out).not.toContain('id="arrow"')
  })
  it('leaves svgs without ids alone and does not touch similar ids', () => {
    expect(scopeSvgIds('<svg><path/></svg>', 'p')).toBe('<svg><path/></svg>')
    const out = scopeSvgIds('<svg><a id="m"/><b id="m2"/><c fill="url(#m2)"/></svg>', 'p')
    expect(out).toContain('id="p-m"')
    expect(out).toContain('id="p-m2"')
    expect(out).toContain('url(#p-m2)')
  })
})
