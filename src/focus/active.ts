export interface FocusLike {
  id: string
  from: string
  to?: string
  endedAt?: string
  createdAt: string
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The focus that applies today: not ended, started, and not past its planned end date.
 * If several qualify (they should not), the one that started last wins.
 */
export function activeFocus<T extends FocusLike>(items: T[], now: Date = new Date()): T | undefined {
  const today = dayKey(now)
  return items
    .filter(f => !f.endedAt && f.from <= today && (!f.to || f.to >= today))
    .sort((a, b) => b.from.localeCompare(a.from) || b.createdAt.localeCompare(a.createdAt))[0]
}

/** Whole days from today to the planned end (0 = ends today), or null without an end date. */
export function daysUntilEnd(focus: Pick<FocusLike, 'to'>, now: Date = new Date()): number | null {
  if (!focus.to) return null
  const [y, m, d] = focus.to.split('-').map(Number)
  const end = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((end - today) / 86_400_000)
}
