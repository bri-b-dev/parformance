export type SimpleSession = { date: string }

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().slice(0, 10)
}

function addDaysKey(key: string, delta: number): string {
  const d = new Date(key + 'T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function computeStreaks(sessions: SimpleSession[], asOf?: string): { current: number; best: number } {
  const dateKeys = Array.from(
    new Set(
      sessions
        .map(s => s.date)
        .filter(Boolean)
        .map(toDateKey),
    ),
  ).sort()

  const datesSet = new Set(dateKeys)

  let best = 0
  let run = 0
  let prev: string | null = null
  for (const dk of dateKeys) {
    if (prev == null) {
      run = 1
    } else {
      const nextOfPrev = addDaysKey(prev, 1)
      if (dk === nextOfPrev) {
        run += 1
      } else {
        run = 1
      }
    }
    if (run > best) best = run
    prev = dk
  }

  const todayKey = asOf ? (asOf.length === 10 ? asOf : toDateKey(asOf)) : new Date().toISOString().slice(0, 10)
  let current = 0
  let cursor = todayKey
  if (!datesSet.has(cursor)) return { current: 0, best }
  while (datesSet.has(cursor)) {
    current += 1
    cursor = addDaysKey(cursor, -1)
  }

  return { current, best }
}

/**
 * Streak as shown on the start screen: counts consecutive practice days up to today,
 * or up to yesterday while today is still open (the streak is alive until the day ends).
 */
export function computeActiveStreak(sessions: SimpleSession[], now: Date = new Date()): { current: number; practicedToday: boolean } {
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const local = new Set(sessions.filter(s => s.date).map(s => key(new Date(s.date))))
  const practicedToday = local.has(key(now))
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!practicedToday) cursor.setDate(cursor.getDate() - 1)
  let current = 0
  while (local.has(key(cursor))) {
    current++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { current, practicedToday }
}

/** Number of sessions since Monday 00:00 (local time) of the week containing `now`. */
export function sessionsThisWeek(sessions: SimpleSession[], now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return sessions.filter(s => s.date && new Date(s.date) >= start).length
}
