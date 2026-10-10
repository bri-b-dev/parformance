import type { HcpSource } from '@/hcp/source'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSettingsStore } from '@/stores/settings'

/**
 * HCP entered by hand: every change in the settings is recorded in the history store.
 * Without history rows the current setting is used as the latest value.
 */
export function useManualHcpSource(): HcpSource {
  const history = useHcpHistoryStore()
  const settings = useSettingsStore()
  return {
    kind: 'manual',
    getHcpAt: (date) => history.getHcpAt(date),
    getLatest: () => history.getLatestHcp() ?? settings.hcp,
    getSeries: () => history.rows.map(r => ({ date: r.valid_from, hcp: r.hcp })),
  }
}
