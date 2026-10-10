import type { LocationQuery, LocationQueryValue } from 'vue-router'
import type { Drill } from '@/types'
import { LOCATION_GROUPS, locationGroup } from '@/filters/location'
import { drillMinutes } from '@/today/suggest'

export type Difficulty = '' | 'easy' | 'mid' | 'hard'

export interface CatalogFilter {
  q: string
  category: string
  tag: string
  /** Only drills up to this many minutes; 0 = any. */
  maxMinutes: number
  difficulty: Difficulty
  place: string
  favorites: boolean
  unplayed: boolean
  belowTarget: boolean
}

export const EMPTY_FILTER: CatalogFilter = {
  q: '', category: '', tag: '', maxMinutes: 0, difficulty: '', place: '', favorites: false, unplayed: false, belowTarget: false,
}

export const DURATION_OPTIONS = [10, 20, 30]
export const DIFFICULTY_OPTIONS: { value: Exclude<Difficulty, ''>; label: string }[] = [
  { value: 'easy', label: 'Leicht (1-2)' },
  { value: 'mid', label: 'Mittel (3)' },
  { value: 'hard', label: 'Schwer (4-5)' },
]

const one = (v: LocationQueryValue | LocationQueryValue[] | undefined): string => Array.isArray(v) ? (v[0] ?? '') : (v ?? '')

/** Read the filter from the URL query; unknown or invalid values are ignored. */
export function parseFilter(query: LocationQuery): CatalogFilter {
  const dur = Number(one(query.dur))
  const diff = one(query.diff)
  const place = one(query.place)
  return {
    q: one(query.q).trim(),
    category: one(query.cat),
    tag: one(query.tag),
    maxMinutes: DURATION_OPTIONS.includes(dur) ? dur : 0,
    difficulty: diff === 'easy' || diff === 'mid' || diff === 'hard' ? diff : '',
    place: (LOCATION_GROUPS as readonly string[]).includes(place) ? place : '',
    favorites: one(query.fav) === '1',
    unplayed: one(query.new) === '1',
    belowTarget: one(query.low) === '1',
  }
}

/** Only non-default values, so the URL stays short and shareable. */
export function filterToQuery(f: CatalogFilter): Record<string, string> {
  const out: Record<string, string> = {}
  if (f.q.trim()) out.q = f.q.trim()
  if (f.category) out.cat = f.category
  if (f.tag) out.tag = f.tag
  if (f.maxMinutes) out.dur = String(f.maxMinutes)
  if (f.difficulty) out.diff = f.difficulty
  if (f.place) out.place = f.place
  if (f.favorites) out.fav = '1'
  if (f.unplayed) out.new = '1'
  if (f.belowTarget) out.low = '1'
  return out
}

/** Keys of the URL query that belong to the filter (everything else must survive a filter change). */
export const FILTER_QUERY_KEYS = ['q', 'cat', 'tag', 'dur', 'diff', 'place', 'fav', 'new', 'low']

/**
 * Two comparable spellings of a text: "ue/ae/oe" for umlauts, and the plain base letters.
 * A search term matches if either of its spellings occurs in either spelling of the text,
 * so "fuer", "für" and "fur" all find "für".
 */
export function searchForms(s: string): string[] {
  const lower = s.toLowerCase()
  const expanded = lower.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  const strip = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const base = lower.replace(/ß/g, 'ss')
  return Array.from(new Set([strip(expanded), strip(base)]))
}

/** Every word of the query must occur in title, tags, summary or category. */
export function matchesQuery(drill: Drill, query: string): boolean {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = searchForms([drill.title, drill.category, drill.summary ?? '', ...(drill.tags ?? [])].join(' \n '))
  return words.every(w => searchForms(w).some(wf => haystack.some(h => h.includes(wf))))
}

export function difficultyOf(drill: Drill): number {
  return Math.min(5, Math.max(1, Math.round(drill.difficulty?.base ?? 3)))
}

const inDifficulty = (drill: Drill, d: Difficulty) => {
  if (!d) return true
  const n = difficultyOf(drill)
  return d === 'easy' ? n <= 2 : d === 'mid' ? n === 3 : n >= 4
}

export interface FilterContext {
  favorites: Set<string>
  /** Drills with at least one session. */
  played: Set<string>
  /** Drills below the target (see areas of improvement). */
  belowTarget: Set<string>
}

export function filterCatalog(drills: Drill[], f: CatalogFilter, ctx: FilterContext): Drill[] {
  return drills.filter(d =>
    (!f.category || d.category === f.category) &&
    (!f.tag || (d.tags ?? []).includes(f.tag)) &&
    (!f.maxMinutes || drillMinutes(d) <= f.maxMinutes) &&
    inDifficulty(d, f.difficulty) &&
    (!f.place || locationGroup(d) === f.place) &&
    (!f.favorites || ctx.favorites.has(d.id)) &&
    (!f.unplayed || !ctx.played.has(d.id)) &&
    (!f.belowTarget || ctx.belowTarget.has(d.id)) &&
    matchesQuery(d, f.q),
  )
}

export interface FilterChip {
  key: keyof CatalogFilter
  label: string
}

/** Active filters (the search text is not a chip, it is visible in the field). */
export function activeChips(f: CatalogFilter): FilterChip[] {
  const chips: FilterChip[] = []
  if (f.category) chips.push({ key: 'category', label: f.category })
  if (f.tag) chips.push({ key: 'tag', label: `Tag: ${f.tag}` })
  if (f.maxMinutes) chips.push({ key: 'maxMinutes', label: `bis ${f.maxMinutes} Min.` })
  if (f.difficulty) chips.push({ key: 'difficulty', label: DIFFICULTY_OPTIONS.find(o => o.value === f.difficulty)!.label })
  if (f.place) chips.push({ key: 'place', label: f.place })
  if (f.favorites) chips.push({ key: 'favorites', label: 'Favoriten' })
  if (f.unplayed) chips.push({ key: 'unplayed', label: 'Noch nie gespielt' })
  if (f.belowTarget) chips.push({ key: 'belowTarget', label: 'Unter Ziel' })
  return chips
}

export function clearKey(f: CatalogFilter, key: keyof CatalogFilter): CatalogFilter {
  return { ...f, [key]: EMPTY_FILTER[key] }
}

export const isFiltered = (f: CatalogFilter) => activeChips(f).length > 0 || f.q.trim() !== ''

export interface CategoryGroup {
  category: string
  drills: Drill[]
}

/** Groups sorted by category, drills by title (German collation). */
export function groupByCategory(drills: Drill[]): CategoryGroup[] {
  const map = new Map<string, Drill[]>()
  for (const d of drills) {
    if (!map.has(d.category)) map.set(d.category, [])
    map.get(d.category)!.push(d)
  }
  return Array.from(map, ([category, list]) => ({ category, drills: [...list].sort((a, b) => a.title.localeCompare(b.title, 'de')) }))
    .sort((a, b) => a.category.localeCompare(b.category, 'de'))
}

/** All tags, most used first. */
export function allTags(drills: Drill[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const d of drills) for (const t of d.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
  return Array.from(counts, ([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'de'))
}

/** Public path of the drill's diagram ("svg:drills/foo" -> "/drills/foo.svg"), or null. */
export function diagramUrl(drill: Drill): string | null {
  const d = drill.setup?.diagram
  if (!d?.startsWith('svg:')) return null
  const clean = (d.split(':')[1] ?? '').replace(/^\/+/, '')
  if (!clean) return null
  return `/${clean}${clean.toLowerCase().endsWith('.svg') ? '' : '.svg'}`
}
