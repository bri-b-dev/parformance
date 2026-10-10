import { useManualHcpSource } from '@/hcp/sources/manual'
import { useRoundsHcpSource } from '@/hcp/sources/rounds'
import { useRoundsStore } from '@/stores/rounds'

/**
 * Where the app gets the player's handicap from. Everything that needs "the HCP at date X" or
 * "the current HCP" (level evaluation, statistics, achievements) goes through this interface.
 *
 * The interface is synchronous on purpose: statistics are computed in Vue computeds. Sources that
 * need async storage (e.g. rounds in IndexedDB) preload their series into memory.
 */
export interface HcpSource {
  /** Where the values come from: rounds of the handicap area, or entered by hand. */
  kind: 'rounds' | 'manual'
  /** HCP that was valid at the given ISO date, or null if unknown. */
  getHcpAt(dateIso: string | Date | undefined): number | null
  /** The most recent HCP, or null if unknown. */
  getLatest(): number | null
  /** Optional time series (ascending by date) for charts. */
  getSeries?(): { date: string; hcp: number }[]
}

/**
 * The active source: as soon as rounds exist the HCP comes only from them (single source of truth);
 * without rounds the manually entered HCP (settings + history of manual changes) is used.
 */
export function useHcpSource(): HcpSource {
  return useRoundsStore().hasRounds ? useRoundsHcpSource() : useManualHcpSource()
}
