import { defineStore } from 'pinia'
import type { Session } from '@/types'
import { createPersist } from '@/utils/persistAdapter'
import { isPersonalBest } from '@/utils/isPersonalBest'
import { useDrillCatalogStore } from '@/stores/drillCatalog'

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
      // Detect personal best (PB) for this drill and fire a friendly toast if detected.
      try {
        const drillCatalog = useDrillCatalogStore()
        const drill = drillCatalog.drills.find(d => d.id === session.drillId)

        // Build a simple metric shape compatible with isPersonalBest util
        const metricKey = 'value'
        const newMapped = { drillId: session.drillId, metrics: { [metricKey]: session.result?.value } }
        const prevMapped = this.sessions
          .filter(s => s.drillId === session.drillId)
          .map(s => ({ drillId: s.drillId, metrics: { [metricKey]: s.result?.value } }))

        // Decide whether greater values are better based on drill metric type (fallback: greater is better)
        const greaterIsBetter = drill?.metric?.type !== 'score_vs_par'

        if (isPersonalBest(newMapped as any, prevMapped , metricKey, { greaterIsBetter })) {
          if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
            let evt: any
            const message = 'PB!'
            try {
              // @ts-ignore CustomEvent may be missing in some environments
              evt = new CustomEvent('toast', { detail: { type: 'success', message } })
            } catch {
              evt = { type: 'toast', detail: { type: 'success', message } }
            }
            globalThis.dispatchEvent(evt)
          }
        }
      } catch (e) {
        // Non-fatal: PB detection shouldn't block session creation
        // swallow errors silently
      }

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
          hcp: typeof (item as any).hcp === 'number' ? (item as any).hcp : 0,
          result: {
            value: Number((item as any).result?.value ?? 0),
            unit: String((item as any).result?.unit ?? ''),
          },
        }
        if (typeof (item as any).timerUsed === 'number') next.timerUsed = (item as any).timerUsed
        if (typeof (item as any).attempts === 'number') next.attempts = (item as any).attempts
        if (typeof (item as any).levelReached === 'number') next.levelReached = (item as any).levelReached
        if (typeof (item as any).favorited === 'boolean') next.favorited = (item as any).favorited
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
