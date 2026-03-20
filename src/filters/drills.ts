import type { Drill } from '@/types'

export interface DrillFilter {
  category?: string
  query?: string
  onlyFavorites?: boolean
  favorites?: string[]
  tag?: string
}

/**
 * Filters drills by category, title query (case-insensitive substring), favorites toggle, and tag.
 */
export function filterDrills(drills: Drill[], filter: DrillFilter): Drill[] {
  const { category, query, onlyFavorites, favorites, tag } = filter || {}
  const q = (query ?? '').trim().toLowerCase()
  const favSet = new Set((favorites ?? []).filter(Boolean))

  return (drills ?? []).filter(d => {
    if (category && d.category !== category) return false
    if (q && !d.title.toLowerCase().includes(q)) return false
    if (tag && (!d.tags || !d.tags.includes(tag))) return false
    return !(onlyFavorites && !favSet.has(d.id));
  })
}
