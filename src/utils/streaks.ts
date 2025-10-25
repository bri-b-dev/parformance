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

export default { computeStreaks }
