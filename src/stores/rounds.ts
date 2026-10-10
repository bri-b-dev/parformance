import { defineStore } from 'pinia'
import { roundsToSeries } from '@/hcp/sources/rounds'

/**
 * Read-only mirror of the handicap series from the rounds in IndexedDB (module `handicap`).
 * Dexie and the module DB are loaded lazily so they stay out of the start bundle; `liveQuery`
 * keeps the series current whenever rounds are added, removed or recalculated.
 */
export const useRoundsStore = defineStore('rounds', {
  state: () => ({
    series: [] as { date: string; hcp: number }[],
    started: false,
    loaded: false,
  }),
  getters: {
    hasRounds: (state) => state.series.length > 0,
  },
  actions: {
    async start() {
      if (this.started) return
      this.started = true
      try {
        const [{ liveQuery }, { db }] = await Promise.all([import('dexie'), import('@/modules/handicap/db')])
        liveQuery(() => db.results.toArray()).subscribe({
          next: (rows) => {
            this.series = roundsToSeries(rows)
            this.loaded = true
          },
          error: (e) => {
            console.debug('rounds liveQuery failed', e)
            this.loaded = true
          },
        })
      } catch (e) {
        console.debug('rounds store start failed', e)
        this.loaded = true
      }
    },
  },
})
