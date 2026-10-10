import type { Drill, Session } from '@/types'
import { computeLevelForDrill, type Level } from '@/hcp/level'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSettingsStore } from '@/stores/settings'

/**
 * Evaluate a session's level using the chosen mode.
 * - mode 'historical' : prefer session.levelReached if present, otherwise use hcp_history.getHcpAt(session.date)
 * - mode 'current' : evaluate using the latest hcp from hcp_history
 */
export function evaluateSessionLevel(session: Session, drill: Drill | undefined, mode: 'historical' | 'current' = 'historical'): Level {
  if (!drill) return 0
  // If the session already has a recorded levelReached, treat that as immutable historical snapshot
  if (mode === 'historical' && typeof session.levelReached === 'number' && Number.isFinite(session.levelReached)) {
    return Math.max(0, Math.min(3, Math.floor(session.levelReached))) as 0 | 1 | 2 | 3
  }
  const hstore = useHcpHistoryStore()
  // Fall back to the HCP recorded on the session / in settings when the history has no matching row.
  const hcp = mode === 'historical'
    ? (hstore.getHcpAt(session.date) ?? (typeof session.hcp === 'number' ? session.hcp : null))
    : (hstore.getLatestHcp() ?? useSettingsStore().hcp)
  return computeLevelForDrill(drill, hcp, Number(session.result?.value))
}

export default { evaluateSessionLevel }
