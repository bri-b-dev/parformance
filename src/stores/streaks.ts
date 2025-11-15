import { defineStore } from 'pinia'
import { useSessionsStore } from './sessions'
import type { Session } from '@/types'
import { computeStreaks } from '@/utils/streaks'

export const useStreaksStore = defineStore('streaks', {
  getters: {
    stats(): { current: number; best: number } {
      const sessionsStore = useSessionsStore()
      const sessions = sessionsStore.sessions as Session[]
      return computeStreaks(
        sessions.map(s => ({ date: s.date }))
      )
    },
    current(): number {
      return this.stats.current
    },
    best(): number {
      return this.stats.best
    }
  },
})
