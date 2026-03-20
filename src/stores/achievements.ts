import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSessionsStore } from '@/stores/sessions'
import { useDrillCatalogStore } from '@/stores/drillCatalog'
import { evaluateSessionLevel } from '@/hcp/evaluator'

const persist = createPersist('parformance', 1)

export type AchievementSnapshot = {
  id: string
  kind: 'badge' | 'achievement' | 'manual'
  title?: string
  description?: string
  drillId?: string | null
  sessionId?: string | null
  level?: number | null
  criteriaVersion: string
  hcp_at_award?: number | null
  awardedAt: string // ISO date
  metadata?: Record<string, any>
}

export interface AchievementsState {
  items: AchievementSnapshot[]
  loaded: boolean
}

export const useAchievementsStore = defineStore('achievements', {
  state: (): AchievementsState => ({ items: [], loaded: false }),
  actions: {
    async load() {
      const data = persist.get<Partial<AchievementsState>>('achievements')
      if (data && Array.isArray(data.items)) this.items = data.items as AchievementSnapshot[]
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('achievements', { items: this.items })
    },
    list(): AchievementSnapshot[] {
      return this.items.slice().sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
    },
    find(id: string) {
      return this.items.find(i => i.id === id) || null
    },
    async add(snapshot: AchievementSnapshot) {
      // ensure unique id
      if (!snapshot.id) throw new Error('snapshot.id required')
      this.items.push(snapshot)
      await this.persist()
    },
    async remove(id: string) {
      const idx = this.items.findIndex(i => i.id === id)
      if (idx >= 0) {
        this.items.splice(idx, 1)
        await this.persist()
      }
    },

    /**
     * Award a badge based on a historical evaluation snapshot of a session.
     * This will not modify the session; it stores a fixed snapshot including the HCP at award time and criteria version.
     */
    async awardBadgeFromSession(opts: {
      id: string
      sessionId: string
      criteriaVersion: string
      kind?: 'badge' | 'achievement' | 'manual'
      title?: string
      description?: string
      metadata?: Record<string, any>
    }) {
      const sessions = useSessionsStore()
      const drills = useDrillCatalogStore()
      const hstore = useHcpHistoryStore()

      // ensure stores are loaded (best-effort)
      if (!sessions.loaded) await sessions.load()
      if (!drills.loaded) await drills.load()
      if (!hstore.loaded) await hstore.load()

      const session = sessions.sessions?.find(s => s.id === opts.sessionId)
      if (!session) throw new Error('session not found')

      const drill = drills.drills?.find(d => d.id === session.drillId)

      // historical evaluation: prefer any stored session.levelReached; otherwise determine HCP at session date
      const level = evaluateSessionLevel(session, drill, 'historical')
      const hcpAtAward = hstore.getHcpAt(session.date)

      const snapshot: AchievementSnapshot = {
        id: opts.id,
        kind: opts.kind ?? 'badge',
        title: opts.title ?? (drill ? `${drill.title} ${level}★` : 'Badge'),
        description: opts.description ?? undefined,
        drillId: drill?.id ?? null,
        sessionId: session.id,
        level: Number.isFinite(Number(level)) ? Number(level) : null,
        criteriaVersion: opts.criteriaVersion,
        hcp_at_award: typeof hcpAtAward === 'number' ? hcpAtAward : null,
        awardedAt: new Date().toISOString(),
        metadata: opts.metadata ?? {},
      }

      this.items.push(snapshot)
      await this.persist()

      return snapshot
    }
  }
})
