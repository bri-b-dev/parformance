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
    async replaceAll(list: Session[]) {
      if (!Array.isArray(list)) {
        this.sessions = []
        await this.persist()
        return
      }
      const sanitized: Session[] = []
      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        const drillId = (item as any).drillId
        const date = (item as any).date
        if (!drillId || !date) continue
        const id = typeof (item as any).id === 'string' && (item as any).id ? (item as any).id : crypto.randomUUID()
        const next: Session = {
          id,
          drillId: String(drillId),
          date: String(date),
          hcp: typeof (item as any).hcp === 'number' ? (item as any).hcp : null,
          result: {
            value: Number((item as any).result?.value ?? 0),
            unit: String((item as any).result?.unit ?? ''),
          },
        }
        if (typeof (item as any).timerUsed === 'number') next.timerUsed = (item as any).timerUsed
        if (typeof (item as any).attempts === 'number') next.attempts = (item as any).attempts
        if (typeof (item as any).levelReached === 'number') next.levelReached = (item as any).levelReached
        if (typeof (item as any).favorited === 'boolean') next.favorited = (item as any).favorited
        if (typeof (item as any).focusId === 'string' && (item as any).focusId) next.focusId = (item as any).focusId
        if (typeof (item as any).notes === 'string') next.notes = (item as any).notes
        sanitized.push(next)
      }
      sanitized.sort((a, b) => b.date.localeCompare(a.date))
      this.sessions = sanitized
      await this.persist()
    },
    async clearAll() {
      this.sessions = []
      await this.persist()
    },
    /** Assign a session to a focus point (or remove the assignment with null). */
    async setFocus(id: string, focusId: string | null) {
      const idx = this.sessions.findIndex(s => s.id === id)
      if (idx === -1) return
      const next = { ...this.sessions[idx] }
      if (focusId) next.focusId = focusId
      else delete next.focusId
      this.sessions[idx] = next
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
