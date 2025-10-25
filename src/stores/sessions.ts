import { defineStore } from 'pinia'
import type { Session } from '@/types'
import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'parformance.sessions.v1'
const isBrowser = typeof window !== 'undefined'

export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    sessions: [] as Session[],
    loaded: false,
  }),
  getters: {
    // Returns all sessions for a given drillId (most recent first)
    listByDrill: (state) => (drillId: string): Session[] =>
      state.sessions
        .filter(s => s.drillId === drillId)
        .sort((a, b) => b.date.localeCompare(a.date)),

    // Returns the latest session for a drillId (by date), or undefined
    latestByDrill(): (drillId: string) => Session | undefined {
      return (drillId: string) => {
        const list = this.listByDrill(drillId)
        return list[0]
      }
    },
  },
  actions: {
    async load() {
      if (!isBrowser) return // skip in non-browser envs (e.g., tests/SSR)
      const stored = await Preferences.get({ key: STORAGE_KEY })
      this.sessions = stored.value ? JSON.parse(stored.value) as Session[] : []
      this.loaded = true
    },
    async persist() {
      if (!isBrowser) return
      await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.sessions) })
    },
    // Create or insert a session. If id is missing, it will be generated.
    async addSession(session: Omit<Session, 'id'> & Partial<Pick<Session, 'id'>>) {
      const id = session.id ?? crypto.randomUUID()
      const toAdd: Session = { ...session, id }
      this.sessions.push(toAdd)
      // Keep sessions roughly ordered by date desc to make getters cheap (not required)
      this.sessions.sort((a, b) => b.date.localeCompare(a.date))
      await this.persist()
      return toAdd
    },
    async remove(id: string) {
      this.sessions = this.sessions.filter(s => s.id !== id)
      await this.persist()
    },
    async clearAll() {
      this.sessions = []
      await this.persist()
    }
  }
})
