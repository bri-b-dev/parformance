import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export interface Collection {
  id: string
  name: string
  drillIds: string[]
  /** Optional icon: a name from the icon set (older data may hold an emoji). */
  icon?: string
  createdAt: string
}

const MAX_NAME = 60

export function sanitizeCollection(raw: unknown): Collection | null {
  const c = raw as Partial<Collection> | null
  if (!c || typeof c !== 'object') return null
  const name = typeof c.name === 'string' ? c.name.trim().slice(0, MAX_NAME) : ''
  if (!name) return null
  const drillIds = Array.isArray(c.drillIds) ? Array.from(new Set(c.drillIds.filter((x): x is string => typeof x === 'string' && !!x))) : []
  return {
    id: typeof c.id === 'string' && c.id ? c.id : crypto.randomUUID(),
    name,
    drillIds,
    icon: typeof c.icon === 'string' && c.icon ? c.icon : undefined,
    createdAt: typeof c.createdAt === 'string' && !Number.isNaN(Date.parse(c.createdAt)) ? c.createdAt : new Date().toISOString(),
  }
}

/** User-defined, ordered groups of drills ("Vor der Runde 20 min", "Wedge-Woche"). */
export const useCollectionsStore = defineStore('collections', {
  state: () => ({ items: [] as Collection[], loaded: false }),
  getters: {
    byId: (state) => (id: string) => state.items.find(c => c.id === id),
  },
  actions: {
    async load() {
      const data = persist.get<{ items?: unknown[] }>('collections')
      this.items = (Array.isArray(data?.items) ? data!.items! : []).map(sanitizeCollection).filter((c): c is Collection => c !== null)
      this.loaded = true
    },
    save() {
      persist.set('collections', { items: this.items })
    },
    add(input: { name: string; drillIds: string[]; icon?: string }): Collection | null {
      const c = sanitizeCollection({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      if (!c) return null
      this.items.push(c)
      this.save()
      return c
    },
    update(id: string, changes: Partial<Pick<Collection, 'name' | 'drillIds' | 'icon'>>): boolean {
      const idx = this.items.findIndex(c => c.id === id)
      if (idx < 0) return false
      const next = sanitizeCollection({ ...this.items[idx], ...changes })
      if (!next) return false
      this.items[idx] = { ...next, id, createdAt: this.items[idx].createdAt }
      this.save()
      return true
    },
    remove(id: string) {
      this.items = this.items.filter(c => c.id !== id)
      this.save()
    },
    /** Replace everything (import); invalid entries are dropped. */
    replaceAll(list: unknown) {
      this.items = (Array.isArray(list) ? list : []).map(sanitizeCollection).filter((c): c is Collection => c !== null)
      this.loaded = true
      this.save()
    },
    clearAll() {
      this.replaceAll([])
    },
  },
})
