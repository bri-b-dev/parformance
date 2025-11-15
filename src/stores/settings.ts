import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'

const persist = createPersist('parformance', 1)

export type Handedness = 'right' | 'left'

export interface SettingsState {
  hcp: number | null
  handedness: Handedness
  name: string
  language: 'de' | 'en'
  units: 'metric' | 'imperial'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  shuffleFavorites: boolean
  notifications: boolean
  loaded: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    hcp: null,
    handedness: 'right',
    name: '',
    language: 'de',
    units: 'metric',
    theme: 'system',
    sounds: true,
    shuffleFavorites: false,
    notifications: false,
    loaded: false,
  }),
  getters: {
    // direct getters if needed in components
    getHcp: (state) => state.hcp,
    getHandedness: (state) => state.handedness,
  },
  actions: {
    emitHcpChanged(value: number | null) {
      if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
        let evt: any
        try {
          // @ts-ignore CustomEvent may be missing in some environments
          evt = new CustomEvent('hcp-changed', { detail: value })
        } catch {
          evt = { type: 'hcp-changed', detail: value }
        }
        globalThis.dispatchEvent(evt)
      }
    },
    emitThemeChanged(value: SettingsState['theme']) {
      if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
        let evt: any
        try {
          // @ts-ignore
          evt = new CustomEvent('theme-preference-changed', { detail: value })
        } catch {
          evt = { type: 'theme-preference-changed', detail: value }
        }
        globalThis.dispatchEvent(evt)
      }
      // Persist the lightweight theme key used by the UI composable so listeners
      // that read localStorage (useTheme) stay in sync even if event timing differs.
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gt.theme', value)
        }
      } catch {
        /* ignore */
      }
      // Also proactively apply the resolved theme to the document so UI updates immediately
      try {
        const resolved = value === 'system'
          ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : value
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.setAttribute('data-theme', resolved)
        }
      } catch (e) {
        // ignore
      }
    },
    async load() {
      const data = persist.get<Partial<SettingsState>>('settings')
      if (data) {
        if (typeof data.hcp === 'number' || data.hcp === null) this.hcp = data.hcp ?? null
        if (data.handedness === 'right' || data.handedness === 'left') this.handedness = data.handedness
        if (typeof data.name === 'string') this.name = data.name
        if (data.language === 'de' || data.language === 'en') this.language = data.language
        if (data.units === 'metric' || data.units === 'imperial') this.units = data.units
        if (data.theme === 'system' || data.theme === 'light' || data.theme === 'dark') this.theme = data.theme
        if (typeof data.sounds === 'boolean') this.sounds = data.sounds
        if (typeof data.shuffleFavorites === 'boolean') this.shuffleFavorites = data.shuffleFavorites
        if (typeof data.notifications === 'boolean') this.notifications = data.notifications
      }
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('settings', {
        hcp: this.hcp,
        handedness: this.handedness,
        name: this.name,
        language: this.language,
        units: this.units,
        theme: this.theme,
        sounds: this.sounds,
        shuffleFavorites: this.shuffleFavorites,
        notifications: this.notifications,
      })
    },
    async update(partial: Partial<Omit<SettingsState, 'loaded'>>) {
      const prevHcp = this.hcp
      if ('hcp' in partial) this.hcp = partial.hcp ?? null
      if ('handedness' in partial && (partial.handedness === 'right' || partial.handedness === 'left')) {
        this.handedness = partial.handedness
      }
      if ('name' in partial && typeof partial.name === 'string') this.name = partial.name
      if ('language' in partial && (partial.language === 'de' || partial.language === 'en')) this.language = partial.language
      if ('units' in partial && (partial.units === 'metric' || partial.units === 'imperial')) this.units = partial.units
      if ('theme' in partial && (partial.theme === 'system' || partial.theme === 'light' || partial.theme === 'dark')) {
        this.theme = partial.theme
      }
      if ('sounds' in partial && typeof partial.sounds === 'boolean') this.sounds = partial.sounds
      if ('shuffleFavorites' in partial && typeof partial.shuffleFavorites === 'boolean') {
        this.shuffleFavorites = partial.shuffleFavorites
      }
      if ('notifications' in partial && typeof partial.notifications === 'boolean') {
        this.notifications = partial.notifications
      }
      await this.persist()
      if ('hcp' in partial && this.hcp !== prevHcp) {
        this.emitHcpChanged(this.hcp)
      }
      if ('theme' in partial) {
        this.emitThemeChanged(this.theme)
      }
    },
    async clearAll() {
      this.hcp = null
      this.handedness = 'right'
      this.name = ''
      this.language = 'de'
      this.units = 'metric'
      this.theme = 'system'
      this.sounds = true
      this.shuffleFavorites = false
      this.notifications = false
      await this.persist()
      this.emitHcpChanged(this.hcp)
      this.emitThemeChanged(this.theme)
    },
  },
})
