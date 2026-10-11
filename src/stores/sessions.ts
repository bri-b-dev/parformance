import { defineStore } from 'pinia'
import type { Session } from '@/types'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

/** One session from untrusted input (import, old data); null if it cannot be a session. */
export function sanitizeSession(item: unknown): Session | null {
  if (!item || typeof item !== 'object') return null
  const r = item as Record<string, any>
  if (!r.drillId || !r.date || Number.isNaN(Date.parse(String(r.date)))) return null
  const next: Session = {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    drillId: String(r.drillId),
    date: String(r.date),
    hcp: typeof r.hcp === 'number' ? r.hcp : null,
    result: { value: Number(r.result?.value ?? 0), unit: String(r.result?.unit ?? '') },
  }
  if (typeof r.timerUsed === 'number') next.timerUsed = r.timerUsed
  if (typeof r.attempts === 'number') next.attempts = r.attempts
  if (typeof r.levelReached === 'number') next.levelReached = r.levelReached
  if (typeof r.favorited === 'boolean') next.favorited = r.favorited
  if (typeof r.focusId === 'string' && r.focusId) next.focusId = r.focusId
  if (typeof r.notes === 'string') next.notes = r.notes
  return next
}

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
      const sanitized = (Array.isArray(list) ? list : []).map(sanitizeSession).filter((x): x is Session => x !== null)
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
