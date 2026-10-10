import { useManualHcpSource } from '@/hcp/sources/manual'

/**
 * Where the app gets the player's handicap from. Everything that needs "the HCP at date X" or
 * "the current HCP" (level evaluation, statistics, achievements) goes through this interface.
 *
 * The interface is synchronous on purpose: statistics are computed in Vue computeds. Sources that
 * need async storage (e.g. rounds in IndexedDB) preload their series into memory.
 */
export interface HcpSource {
  /** HCP that was valid at the given ISO date, or null if unknown. */
  getHcpAt(dateIso: string | Date | undefined): number | null
  /** The most recent HCP, or null if unknown. */
  getLatest(): number | null
  /** Optional time series (ascending by date) for charts. */
  getSeries?(): { date: string; hcp: number }[]
}

/** The active source. Currently always the manual one (settings + history of manual changes). */
export function useHcpSource(): HcpSource {
  return useManualHcpSource()
}
