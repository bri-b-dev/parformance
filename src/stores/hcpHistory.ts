import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export type HcpHistoryRow = {
  id: string
  hcp: number
  valid_from: string // ISO date
  valid_to?: string | null // ISO date or null for open-ended
}

export interface HcpHistoryState {
  rows: HcpHistoryRow[]
  loaded: boolean
}

export const useHcpHistoryStore = defineStore('hcpHistory', {
  state: (): HcpHistoryState => ({ rows: [], loaded: false }),
  actions: {
    async load() {
      const data = persist.get<Partial<HcpHistoryState>>('hcp_history')
      if (data && Array.isArray(data.rows)) this.rows = data.rows as HcpHistoryRow[]
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('hcp_history', { rows: this.rows })
    },
    /** Add a new history row and persist. */
    async add(row: HcpHistoryRow) {
      this.rows.push(row)
      // keep sorted by valid_from asc
      this.rows.sort((a, b) => (a.valid_from || '').localeCompare(b.valid_from || ''))
      await this.persist()
    },
    /** Return the hcp value valid at the given ISO date (sessionDate). */
    getHcpAt(sessionDateIso: string | Date | undefined): number | null {
      if (!sessionDateIso) return null
      const iso = (sessionDateIso instanceof Date) ? sessionDateIso.toISOString() : String(sessionDateIso)
      // find row where valid_from <= iso < valid_to (or valid_to is null)
      for (let i = this.rows.length - 1; i >= 0; i--) {
        const r = this.rows[i]
        if (!r?.valid_from) continue
        if (iso >= r.valid_from) {
          if (!r.valid_to || iso < r.valid_to) return r.hcp
        }
      }
      return null
    },
    /** Return the latest (most recent) hcp value from history. */
    getLatestHcp(): number | null {
      if (!this.rows.length) return null
      // assume rows sorted by valid_from asc
      const r = this.rows[this.rows.length - 1]
      return r?.hcp ?? null
    }
  }
})

export default useHcpHistoryStore
