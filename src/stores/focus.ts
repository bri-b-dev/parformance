import { defineStore } from 'pinia'
import { activeFocus, dayKey, type FocusLike } from '@/focus/active'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export interface Focus extends FocusLike {
  /** Free text, e.g. "Tempo" or "Lag-Putting 10-15 m". */
  label: string
  /** Optional collection whose drills belong to this focus. */
  collectionId?: string
}

const MAX_LABEL = 60
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

function sanitize(raw: unknown): Focus | null {
  const f = raw as Partial<Focus> | null
  if (!f || typeof f !== 'object') return null
  const label = typeof f.label === 'string' ? f.label.trim().slice(0, MAX_LABEL) : ''
  if (!label) return null
  return {
    id: typeof f.id === 'string' && f.id ? f.id : crypto.randomUUID(),
    label,
    collectionId: typeof f.collectionId === 'string' && f.collectionId ? f.collectionId : undefined,
    from: isDay(f.from) ? f.from : dayKey(new Date()),
    to: isDay(f.to) ? f.to : undefined,
    endedAt: typeof f.endedAt === 'string' && !Number.isNaN(Date.parse(f.endedAt)) ? f.endedAt : undefined,
    createdAt: typeof f.createdAt === 'string' && !Number.isNaN(Date.parse(f.createdAt)) ? f.createdAt : new Date().toISOString(),
  }
}

/** Focus points: a free-text goal for a period (and optionally a collection), e.g. "Tempo" this week. */
export const useFocusStore = defineStore('focus', {
  state: () => ({ items: [] as Focus[], loaded: false }),
  getters: {
    active: (state): Focus | undefined => activeFocus(state.items),
    byId: (state) => (id: string) => state.items.find(f => f.id === id),
    /** Newest first. */
    list: (state): Focus[] => [...state.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  actions: {
    async load() {
      const data = persist.get<{ items?: unknown[] }>('focus')
      this.items = (Array.isArray(data?.items) ? data!.items! : []).map(sanitize).filter((f): f is Focus => f !== null)
      this.loaded = true
    },
    save() {
      persist.set('focus', { items: this.items })
    },
    /** Start a new focus today; any focus that is still running is ended (one active focus at a time). */
    start(input: { label: string; collectionId?: string; to?: string }): Focus | null {
      const f = sanitize({ ...input, id: crypto.randomUUID(), from: dayKey(new Date()), createdAt: new Date().toISOString() })
      if (!f) return null
      const now = new Date().toISOString()
      for (const other of this.items) if (!other.endedAt) other.endedAt = now
      this.items.push(f)
      this.save()
      return f
    },
    update(id: string, changes: Partial<Pick<Focus, 'label' | 'collectionId' | 'to'>>): boolean {
      const idx = this.items.findIndex(f => f.id === id)
      if (idx < 0) return false
      const next = sanitize({ ...this.items[idx], ...changes })
      if (!next) return false
      this.items[idx] = { ...next, id, createdAt: this.items[idx].createdAt, from: this.items[idx].from, endedAt: this.items[idx].endedAt }
      this.save()
      return true
    },
    end(id: string) {
      const f = this.items.find(x => x.id === id)
      if (f && !f.endedAt) {
        f.endedAt = new Date().toISOString()
        this.save()
      }
    },
    remove(id: string) {
      this.items = this.items.filter(f => f.id !== id)
      this.save()
    },
    replaceAll(list: unknown) {
      this.items = (Array.isArray(list) ? list : []).map(sanitize).filter((f): f is Focus => f !== null)
      this.loaded = true
      this.save()
    },
    clearAll() {
      this.replaceAll([])
    },
  },
})
