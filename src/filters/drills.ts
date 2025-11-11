import type { Drill } from '@/types'

export interface DrillFilter {
  category?: string
  query?: string
  onlyFavorites?: boolean
  favorites?: string[]
}

/**
 * Filters drills by category, title query (case-insensitive substring) and favorites toggle.
 */
export function filterDrills(drills: Drill[], filter: DrillFilter): Drill[] {
  const { category, query, onlyFavorites, favorites } = filter || {}
  const q = (query ?? '').trim().toLowerCase()
  const favSet = new Set((favorites ?? []).filter(Boolean))

  return (drills ?? []).filter(d => {
    if (category && d.category !== category) return false
    if (q && !d.title.toLowerCase().includes(q)) return false
    return !(onlyFavorites && !favSet.has(d.id));
  })
}

export default { filterDrills }
