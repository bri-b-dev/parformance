import { defineStore } from 'pinia'
import type { Session } from '@/types'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export interface RunStep {
  drillId: string
  status: 'pending' | 'done' | 'skipped'
  sessionId?: string
}

export interface Run {
  id: string
  title: string
  collectionId?: string
  steps: RunStep[]
  /** Index of the current step. */
  index: number
  startedAt: string
  /** Set when the run is over (all steps passed or ended early); the run then shows its summary. */
  finishedAt?: string
}

function sanitizeRun(raw: unknown): Run | null {
  const r = raw as Partial<Run> | null
  if (!r || typeof r !== 'object' || !Array.isArray(r.steps) || r.steps.length === 0) return null
  const steps: RunStep[] = r.steps
    .filter((s): s is RunStep => !!s && typeof s.drillId === 'string' && !!s.drillId)
    .map(s => ({
      drillId: s.drillId,
      status: s.status === 'done' || s.status === 'skipped' ? s.status : 'pending',
      sessionId: typeof s.sessionId === 'string' ? s.sessionId : undefined,
    }))
  if (steps.length === 0 || typeof r.startedAt !== 'string') return null
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    title: typeof r.title === 'string' && r.title ? r.title : 'Einheit',
    collectionId: typeof r.collectionId === 'string' ? r.collectionId : undefined,
    steps,
    index: Math.min(Math.max(0, Math.floor(Number(r.index) || 0)), steps.length - 1),
    startedAt: r.startedAt,
    finishedAt: typeof r.finishedAt === 'string' ? r.finishedAt : undefined,
  }
}

/** The training session ("Einheit") that is currently being walked through; persisted so it survives restarts. */
export const useRunStore = defineStore('run', {
  state: () => ({ run: null as Run | null, loaded: false }),
  getters: {
    total: (s) => s.run?.steps.length ?? 0,
    current: (s) => (s.run ? s.run.steps[s.run.index] : undefined),
    finished: (s) => !!s.run?.finishedAt,
    doneCount: (s) => s.run?.steps.filter(x => x.status === 'done').length ?? 0,
    isLast: (s) => !!s.run && s.run.index >= s.run.steps.length - 1,
  },
  actions: {
    async load() {
      this.run = sanitizeRun(persist.get('run'))
      this.loaded = true
    },
    save() {
      persist.set('run', this.run)
    },
    start(input: { title: string; drillIds: string[]; collectionId?: string }): boolean {
      const ids = input.drillIds.filter(Boolean)
      if (ids.length === 0) return false
      this.run = {
        id: crypto.randomUUID(),
        title: input.title || 'Einheit',
        collectionId: input.collectionId,
        steps: ids.map(drillId => ({ drillId, status: 'pending' as const })),
        index: 0,
        startedAt: new Date().toISOString(),
      }
      this.save()
      return true
    },
    /** Mark the current step as done by a saved session. */
    complete(sessionId: string) {
      const step = this.current
      if (!this.run || !step || step.status !== 'pending') return
      step.status = 'done'
      step.sessionId = sessionId
      this.save()
    },
    /**
     * Link a session saved since the run started to the current step (called after saves and on mount,
     * so a session saved just before a restart is not lost).
     */
    attachSession(sessions: Session[]) {
      const step = this.current
      if (!this.run || this.run.finishedAt || !step || step.status !== 'pending') return
      const used = new Set(this.run.steps.map(s => s.sessionId).filter(Boolean))
      const match = sessions
        .filter(s => s.drillId === step.drillId && s.date >= this.run!.startedAt && !used.has(s.id))
        .sort((a, b) => a.date.localeCompare(b.date))[0]
      if (match) this.complete(match.id)
    },
    /** Skip the current step and move on. */
    skip() {
      const step = this.current
      if (!this.run || !step) return
      if (step.status === 'pending') step.status = 'skipped'
      this.next()
    },
    next() {
      if (!this.run) return
      if (this.run.index >= this.run.steps.length - 1) this.finish()
      else this.run.index++
      this.save()
    },
    back() {
      if (!this.run || this.run.index === 0) return
      this.run.index--
      this.save()
    },
    finish() {
      if (!this.run || this.run.finishedAt) return
      this.run.finishedAt = new Date().toISOString()
      this.save()
    },
    /** Drop the run (after the summary, or when it is abandoned). */
    clear() {
      this.run = null
      this.save()
    },
  },
})
