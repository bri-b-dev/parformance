import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export type GamerSettings = {
  mode?: string
  handicapOffset?: number
  collapsed?: boolean
}

export const useGamerSettingsStore = defineStore('gamerSettings', {
  state: () => ({
    // map drillId -> settings
    map: {} as Record<string, GamerSettings>,
    loaded: false,
  }),
  getters: {
    forDrill: (state) => (drillId: string) => state.map[drillId] ?? { collapsed: true, mode: undefined, handicapOffset: 0 },
  },
  actions: {
    async load() {
      const stored = persist.get<Record<string, GamerSettings>>('gamerSettings')
      this.map = stored && typeof stored === 'object' ? stored : {}
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('gamerSettings', this.map)
    },
    async setFor(drillId: string, next: GamerSettings) {
      this.map = { ...this.map, [drillId]: { ...(this.map[drillId] ?? {}), ...next } }
      await this.persist()
    },
    async setCollapsed(drillId: string, collapsed: boolean) {
      await this.setFor(drillId, { collapsed })
    },
    async setMode(drillId: string, mode?: string) {
      await this.setFor(drillId, { mode })
    },
    async setHandicapOffset(drillId: string, handicapOffset?: number) {
      await this.setFor(drillId, { handicapOffset })
    }
  }
})
