import type { HcpSource } from '@/hcp/source'
import { useRoundsStore } from '@/stores/rounds'

export interface RoundPoint {
  date: string
  storedHandicap: number
  id?: number
}

/** Ascending series of "HCP after this round" from stored rounds; rounds without a usable value are dropped. */
export function roundsToSeries(rounds: RoundPoint[]): { date: string; hcp: number }[] {
  return rounds
    .filter(r => typeof r.storedHandicap === 'number' && Number.isFinite(r.storedHandicap) && !Number.isNaN(Date.parse(r.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || (a.id ?? 0) - (b.id ?? 0))
    .map(r => ({ date: r.date, hcp: r.storedHandicap }))
}

/**
 * The index valid at a point in time is the one after the latest round played on or before that date.
 * Round dates are plain days (UTC midnight), so a session later the same day already sees that round.
 */
export function hcpAtDate(series: { date: string; hcp: number }[], when: string | Date | undefined): number | null {
  if (!when) return null
  const t = when instanceof Date ? when.getTime() : Date.parse(when)
  if (Number.isNaN(t)) return null
  let found: number | null = null
  for (const p of series) {
    if (Date.parse(p.date) <= t) found = p.hcp
    else break
  }
  return found
}

/** HCP derived from the rounds recorded in the handicap area. */
export function useRoundsHcpSource(): HcpSource {
  const rounds = useRoundsStore()
  return {
    kind: 'rounds',
    getHcpAt: (date) => hcpAtDate(rounds.series, date),
    getLatest: () => rounds.series.at(-1)?.hcp ?? null,
    getSeries: () => rounds.series,
  }
}
