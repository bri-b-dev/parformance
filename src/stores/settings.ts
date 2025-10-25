import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'parformance.settings.v1'

export type Handedness = 'right' | 'left'

export interface SettingsState {
  hcp: number | null
  handedness: Handedness
  loaded: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    hcp: null,
    handedness: 'right',
    loaded: false,
  }),
  getters: {
    // direct getters if needed in components
    getHcp: (state) => state.hcp,
    getHandedness: (state) => state.handedness,
  },
  actions: {
    async load() {
      // Gracefully handle empty storage
      const stored = await Preferences.get({ key: STORAGE_KEY })
      if (stored.value) {
        try {
          const data = JSON.parse(stored.value) as Partial<SettingsState>
          if (typeof data.hcp === 'number' || data.hcp === null) this.hcp = data.hcp ?? null
          if (data.handedness === 'right' || data.handedness === 'left') this.handedness = data.handedness
        } catch {
          // ignore corrupted storage
        }
      }
      this.loaded = true
    },
    async persist() {
      await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify({ hcp: this.hcp, handedness: this.handedness }) })
    },
    async setHcp(hcp: number | null) {
      this.hcp = hcp
      // Emit a browser event so components can re-render HCP highlights
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        let evt: any
        try {
          // Prefer CustomEvent when available (browser)
          // @ts-ignore - CustomEvent may not exist in Node
          evt = new CustomEvent('hcp-changed', { detail: hcp })
        } catch {
          // Fallback for non-browser test environments
          evt = { type: 'hcp-changed', detail: hcp }
        }
        window.dispatchEvent(evt as any)
      }
      await this.persist()
    },
    async setHandedness(value: Handedness) {
      this.handedness = value
      await this.persist()
    },
    async clearAll() {
      this.hcp = null
      this.handedness = 'right'
      await this.persist()
    },
  },
})
