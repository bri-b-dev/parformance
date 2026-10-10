export interface GoalProgress {
  /** Whole days until the goal date (negative when overdue). */
  daysLeft: number
  weeksLeft: number
  overdue: boolean
}

/** Days/weeks until a YYYY-MM-DD goal date, counted from `now` (calendar days, local time). */
export function computeGoalProgress(targetDate: string | null | undefined, now: Date = new Date()): GoalProgress | null {
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null
  const [y, m, d] = targetDate.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  if (Number.isNaN(target)) return null
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const daysLeft = Math.round((target - today) / 86_400_000)
  return { daysLeft, weeksLeft: Math.ceil(Math.max(0, daysLeft) / 7), overdue: daysLeft < 0 }
}

export function formatGoalDate(targetDate: string): string {
  const [y, m, d] = targetDate.split('-')
  return `${d}.${m}.${y}`
}
