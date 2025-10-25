import { defineStore } from 'pinia'
import type { Session } from '@/types'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

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
      const stored = persist.get<Session[]>('sessions')
      this.sessions = Array.isArray(stored) ? stored : []
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('sessions', this.sessions)
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
    },
    async updateNotes(id: string, notes: string | undefined | null) {
      const idx = this.sessions.findIndex(s => s.id === id)
      if (idx !== -1) {
        const next = { ...this.sessions[idx], notes: notes ?? undefined }
        this.sessions[idx] = next
        await this.persist()
      }
    }
  }
})
