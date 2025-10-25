import { defineStore } from 'pinia'
import type { Drill } from '@/types'

export const useDrillCatalogStore = defineStore('drillCatalog', {
  state: () => ({
    drills: [] as Drill[],
    loaded: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      if (this.loaded && this.drills.length > 0) return
      try {
        // Prefer dynamic import so Vite bundles JSON for production.
        // In the Vitest environment require() the JSON synchronously to avoid async loader timing issues in tests.
        let mod: any
        if (typeof process !== 'undefined' && (process.env.VITEST || process.env.NODE_ENV === 'test')) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          mod = require('../data/drills.json')
        } else {
          // @ts-ignore - dynamic import of JSON handled by Vite during build
          mod = await import('../data/drills.json')
        }
        const data = (mod?.default ?? mod) as Drill[]
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No drills found in drills.json')
        }
        this.drills = data
        this.error = null
      } catch (e: any) {
        const message = 'Konnte Drills nicht laden. Bitte später erneut versuchen.'
        this.error = e?.message || message
        // Friendly toast event for the UI (browser only)
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          let evt: any
          try {
            // @ts-ignore CustomEvent may be missing in some environments
            evt = new CustomEvent('toast', { detail: { type: 'error', message } })
          } catch {
            evt = { type: 'toast', detail: { type: 'error', message } }
          }
          window.dispatchEvent(evt as any)
        }
      } finally {
        this.loaded = true
      }
    },
  },
})
