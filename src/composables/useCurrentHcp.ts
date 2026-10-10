import { computed } from 'vue'
import { useHcpSource } from '@/hcp/source'
import { useRoundsStore } from '@/stores/rounds'

/** The player's current HCP (from rounds if any, else manual) and whether it is derived from rounds. */
export function useCurrentHcp() {
  const rounds = useRoundsStore()
  const hcp = computed(() => useHcpSource().getLatest())
  const fromRounds = computed(() => rounds.hasRounds)
  return { hcp, fromRounds }
}
