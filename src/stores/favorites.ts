import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [] as string[],
    loaded: false,
  }),
  getters: {
    isFavorite: (state) => (drillId: string) => state.favorites.includes(drillId),
    list: (state) => state.favorites,
  },
  actions: {
    async load() {
      const stored = persist.get<string[]>('favorites')
      this.favorites = Array.isArray(stored) ? stored : []
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('favorites', this.favorites)
    },
    async add(drillId: string) {
      if (!this.favorites.includes(drillId)) {
        this.favorites.push(drillId)
        await this.persist()
      }
    },
    async remove(drillId: string) {
      const next = this.favorites.filter(id => id !== drillId)
      if (next.length !== this.favorites.length) {
        this.favorites = next
        await this.persist()
      }
    },
    async toggle(drillId: string) {
      if (this.favorites.includes(drillId)) {
        await this.remove(drillId)
      } else {
        await this.add(drillId)
      }
    },
    async clearAll() {
      this.favorites = []
      await this.persist()
    }
  }
})
