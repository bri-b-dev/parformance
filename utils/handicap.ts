import { WHS_WINDOW, applyCap, computeBaseHandicap, getCalculationRule } from './calculations'

export interface HistoryInput {
  id?: number
  date: string
  scoreDifferential: number
}

export type HistoryEntry<T extends HistoryInput> = T & {
  /** Handicap index after this round (incl. caps) */
  storedHandicap: number
  /** true if the round counts towards the *latest* handicap index */
  counting: boolean
}

function byDateAsc(a: HistoryInput, b: HistoryInput): number {
  const d = new Date(a.date).getTime() - new Date(b.date).getTime()
  if (d !== 0) return d
  return (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER)
}

/**
 * Indices (into `window`) of the differentials that count: the best N per WHS table.
 * Ties are resolved in favour of the more recent round.
 */
function pickCounting(window: HistoryInput[]): number[] {
  const { count } = getCalculationRule(window.length)
  return window
    .map((r, i) => ({ sd: r.scoreDifferential, i }))
    .sort((a, b) => a.sd - b.sd || b.i - a.i)
    .slice(0, count)
    .map((x) => x.i)
}

/**
 * Recomputes the handicap index after every round (oldest first).
 * Each index uses only the most recent {@link WHS_WINDOW} rounds up to that round.
 * The result is sorted ascending by date; `counting` is set for the rounds
 * that make up the latest index.
 */
export function calculateHistory<T extends HistoryInput>(rounds: T[]): HistoryEntry<T>[] {
  const ascending = [...rounds].sort(byDateAsc)
  const capRecords: { date: string; storedHandicap: number }[] = []
  const entries: HistoryEntry<T>[] = []
  let prevHC: number | null = null
  let latestCounting: number[] = []
  let latestStart = 0

  for (let i = 0; i < ascending.length; i++) {
    const start = Math.max(0, i + 1 - WHS_WINDOW)
    const window = ascending.slice(start, i + 1)
    const diffs = window.map((r) => r.scoreDifferential).sort((a, b) => a - b)

    capRecords.push({ date: ascending[i].date, storedHandicap: 0 })
    const hc = applyCap(computeBaseHandicap(diffs, prevHC), capRecords, i)
    capRecords[i].storedHandicap = hc
    prevHC = hc

    entries.push({ ...ascending[i], storedHandicap: hc, counting: false })
    if (i === ascending.length - 1) {
      latestCounting = pickCounting(window)
      latestStart = start
    }
  }

  for (const idx of latestCounting) entries[latestStart + idx].counting = true
  return entries
}

/** Handicap index that would result from adding `newRound` to `existing`. */
export function projectHandicap(existing: HistoryInput[], newRound: { date: string; scoreDifferential: number }): number {
  const NEW_ID = -1
  const entries = calculateHistory([...existing, { ...newRound, id: NEW_ID }])
  return entries.find((e) => e.id === NEW_ID)!.storedHandicap
}
