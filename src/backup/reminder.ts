export const REMINDER_THRESHOLD = 10
export const FIRST_BACKUP_AT = 5
export const OLD_AFTER_DAYS = 30
export const SNOOZE_DAYS = 7

export interface ReminderInput {
  now: Date
  lastBackupAt: string | null
  /** Sessions + rounds at the time of the last backup. */
  lastBackupCount: number
  /** Sessions + rounds now. */
  currentCount: number
  snoozedUntil: string | null
}

export type ReminderReason = 'never' | 'many' | 'old'

export interface ReminderResult {
  due: boolean
  reason: ReminderReason | null
  /** New sessions + rounds since the last backup. */
  newItems: number
}

/**
 * When to remind about a backup: the first one once there is something worth keeping (5 entries),
 * then after 10 new sessions/rounds, or after 30 days if anything changed. "Später" snoozes for 7 days.
 */
export function backupReminder(i: ReminderInput): ReminderResult {
  const newItems = Math.max(0, i.currentCount - i.lastBackupCount)
  const quiet = i.snoozedUntil !== null && Date.parse(i.snoozedUntil) > i.now.getTime()
  if (quiet) return { due: false, reason: null, newItems }
  if (i.lastBackupAt === null) return i.currentCount >= FIRST_BACKUP_AT ? { due: true, reason: 'never', newItems: i.currentCount } : { due: false, reason: null, newItems: i.currentCount }
  if (newItems >= REMINDER_THRESHOLD) return { due: true, reason: 'many', newItems }
  const days = (i.now.getTime() - Date.parse(i.lastBackupAt)) / 86_400_000
  if (days >= OLD_AFTER_DAYS && newItems >= 1) return { due: true, reason: 'old', newItems }
  return { due: false, reason: null, newItems }
}

export const snoozeUntil = (now: Date, days = SNOOZE_DAYS) => new Date(now.getTime() + days * 86_400_000).toISOString()
