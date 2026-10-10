import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // transient per-drill UI flags (not persisted)
    gamblerCollapsed: {} as Record<string, boolean>,
    // whether the shuffle overlay/modal is open (transient)
    shuffleOpen: false as boolean,
    // whether the settings sheet is open (transient)
    settingsOpen: false as boolean,
    // active tag filter shared between DrillList and Randomizer
    activeTag: '' as string,
    // active category filter
    activeCategory: '' as string,
  }),
  getters: {
    isGamblerCollapsed: (state) => (drillId: string) => {
      if (!drillId) return true
      return state.gamblerCollapsed[drillId] ?? true
    }
  },
  actions: {
    setGamblerCollapsed(drillId: string, collapsed: boolean) {
      this.gamblerCollapsed = { ...this.gamblerCollapsed, [drillId]: collapsed }
    },
    setSettings(open: boolean) {
      this.settingsOpen = !!open
    },
    setShuffle(open: boolean) {
      this.shuffleOpen = !!open
    },
    setActiveTag(tag: string) {
      this.activeTag = tag
    },
    setActiveCategory(category: string) {
      this.activeCategory = category
    }
  }
})
