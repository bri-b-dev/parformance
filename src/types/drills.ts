// Compatibility types for legacy drill editing/store code
// Note: This is distinct from the spec types exported at '@/types'.

export type DrillCategory = 'chipping' | 'putting' | 'driving' | 'irons' | 'bunker'

export interface Drill {
  id: string
  title: string
  category: DrillCategory
  difficulty?: 1 | 2 | 3 | 4 | 5
  durationMin?: number
  description?: string
  tags?: string[]
  updatedAt: string
}
