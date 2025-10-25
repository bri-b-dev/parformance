import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // transient per-drill UI flags (not persisted)
    gamblerCollapsed: {} as Record<string, boolean>,
  }),
  getters: {
    isGamblerCollapsed: (state) => (drillId: string) => {
      if (!drillId) return true
      return state.gamblerCollapsed[drillId] ?? true
    }
  },
  actions: {
    setGamblerCollapsed(drillId: string, collapsed: boolean) {
      this.gamblerCollapsed = { ...(this.gamblerCollapsed || {}), [drillId]: collapsed }
    }
  }
})
