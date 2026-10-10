import type { Drill } from '@/types'

export const LOCATION_GROUPS = ['Putting', 'Kurzspiel', 'Bunker', 'Range', 'Platz'] as const
export type LocationGroup = typeof LOCATION_GROUPS[number] | 'Sonstige'

/**
 * Coarse place to practice, derived from the free-text `setup.location`
 * (e.g. "Chipping Green" -> Kurzspiel, "Driving Range oder Übungsfläche" -> Range).
 */
export function locationGroup(drill: Pick<Drill, 'setup'>): LocationGroup {
  const loc = String(drill.setup?.location ?? '').toLowerCase()
  if (/bunker/.test(loc)) return 'Bunker'
  if (/golfplatz|^platz/.test(loc)) return 'Platz'
  if (/putting|^grün$/.test(loc)) return 'Putting'
  if (/chipping|pitch|kurzspiel|vorgrün|rund ums/.test(loc)) return 'Kurzspiel'
  if (/driving|range|approach/.test(loc)) return 'Range'
  return 'Sonstige'
}
