import { defineStore } from 'pinia'
import { createPersist } from '@/utils/persistAdapter'
import { useHcpHistoryStore } from '@/stores/hcpHistory'

const persist = createPersist('parformance', 1)

export const HCP_MIN = -10
export const HCP_MAX = 54

export function normalizeHcp(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= HCP_MIN && v <= HCP_MAX ? v : null
}

export function normalizeDate(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null
}

export type Handedness = 'right' | 'left'

export interface SettingsState {
  hcp: number | null
  /** Goal handicap and optional goal date (YYYY-MM-DD). Used to derive target areas. */
  targetHcp: number | null
  targetDate: string | null
  handedness: Handedness
  name: string
  language: 'de' | 'en'
  units: 'metric' | 'imperial'
  theme: 'system' | 'light' | 'dark'
  sounds: boolean
  shuffleFavorites: boolean
  notifications: boolean
  /** True once the first-run onboarding was completed or skipped. */
  onboardingDone: boolean
  /** True once the "no handicap" hint was dismissed. */
  hcpHintDismissed: boolean
  /** When the last backup was exported and how many sessions + rounds it held (device specific, not exported). */
  lastBackupAt: string | null
  lastBackupCount: number
  /** The backup reminder stays quiet until this ISO time. */
  backupSnoozedUntil: string | null
  loaded: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    hcp: null,
    targetHcp: null,
    targetDate: null,
    handedness: 'right',
    name: '',
    language: 'de',
    units: 'metric',
    theme: 'system',
    sounds: true,
    shuffleFavorites: false,
    notifications: false,
    onboardingDone: false,
    hcpHintDismissed: false,
    lastBackupAt: null,
    lastBackupCount: 0,
    backupSnoozedUntil: null,
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
    /** Append a valid-from row to the HCP history so past sessions can be evaluated with the HCP of their time. */
    async recordHcp(value: number | null) {
      if (typeof value !== 'number') return
      const history = useHcpHistoryStore()
      if (!history.loaded) await history.load()
      const now = new Date().toISOString()
      const last = history.rows[history.rows.length - 1]
      if (last && !last.valid_to) last.valid_to = now
      await history.add({ id: crypto.randomUUID(), hcp: value, valid_from: now, valid_to: null })
    },
    async load() {
      const data = persist.get<Partial<SettingsState>>('settings')
      if (data) {
        if (typeof data.hcp === 'number' || data.hcp === null) this.hcp = data.hcp ?? null
        if ('targetHcp' in data) this.targetHcp = normalizeHcp(data.targetHcp)
        if ('targetDate' in data) this.targetDate = normalizeDate(data.targetDate)
        if (data.handedness === 'right' || data.handedness === 'left') this.handedness = data.handedness
        if (typeof data.name === 'string') this.name = data.name
        if (data.language === 'de' || data.language === 'en') this.language = data.language
        if (data.units === 'metric' || data.units === 'imperial') this.units = data.units
        if (data.theme === 'system' || data.theme === 'light' || data.theme === 'dark') this.theme = data.theme
        if (typeof data.sounds === 'boolean') this.sounds = data.sounds
        if (typeof data.shuffleFavorites === 'boolean') this.shuffleFavorites = data.shuffleFavorites
        if (typeof data.notifications === 'boolean') this.notifications = data.notifications
        if (typeof data.onboardingDone === 'boolean') this.onboardingDone = data.onboardingDone
        // Existing installs from before onboarding existed must not see the first-run dialog again.
        else this.onboardingDone = true
        if (typeof data.hcpHintDismissed === 'boolean') this.hcpHintDismissed = data.hcpHintDismissed
        if (typeof data.lastBackupAt === 'string' && !Number.isNaN(Date.parse(data.lastBackupAt))) this.lastBackupAt = data.lastBackupAt
        if (typeof data.lastBackupCount === 'number' && data.lastBackupCount >= 0) this.lastBackupCount = Math.floor(data.lastBackupCount)
        if (typeof data.backupSnoozedUntil === 'string' && !Number.isNaN(Date.parse(data.backupSnoozedUntil))) this.backupSnoozedUntil = data.backupSnoozedUntil
      }
      this.loaded = true
    },
    async persist() {
      persist.setDebounced('settings', {
        hcp: this.hcp,
        targetHcp: this.targetHcp,
        targetDate: this.targetDate,
        handedness: this.handedness,
        name: this.name,
        language: this.language,
        units: this.units,
        theme: this.theme,
        sounds: this.sounds,
        shuffleFavorites: this.shuffleFavorites,
        notifications: this.notifications,
        onboardingDone: this.onboardingDone,
        hcpHintDismissed: this.hcpHintDismissed,
        lastBackupAt: this.lastBackupAt,
        lastBackupCount: this.lastBackupCount,
        backupSnoozedUntil: this.backupSnoozedUntil,
      })
    },
    async update(partial: Partial<Omit<SettingsState, 'loaded'>>) {
      const prevHcp = this.hcp
      if ('hcp' in partial) this.hcp = partial.hcp ?? null
      if ('targetHcp' in partial) this.targetHcp = normalizeHcp(partial.targetHcp)
      if ('targetDate' in partial) this.targetDate = normalizeDate(partial.targetDate)
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
      if ('onboardingDone' in partial && typeof partial.onboardingDone === 'boolean') this.onboardingDone = partial.onboardingDone
      if ('hcpHintDismissed' in partial && typeof partial.hcpHintDismissed === 'boolean') this.hcpHintDismissed = partial.hcpHintDismissed
      if ('lastBackupAt' in partial) this.lastBackupAt = typeof partial.lastBackupAt === 'string' && !Number.isNaN(Date.parse(partial.lastBackupAt)) ? partial.lastBackupAt : null
      if ('lastBackupCount' in partial && typeof partial.lastBackupCount === 'number') this.lastBackupCount = Math.max(0, Math.floor(partial.lastBackupCount))
      if ('backupSnoozedUntil' in partial) this.backupSnoozedUntil = typeof partial.backupSnoozedUntil === 'string' && !Number.isNaN(Date.parse(partial.backupSnoozedUntil)) ? partial.backupSnoozedUntil : null
      if ('notifications' in partial && typeof partial.notifications === 'boolean') {
        this.notifications = partial.notifications
      }
      await this.persist()
      if ('hcp' in partial && this.hcp !== prevHcp) {
        await this.recordHcp(this.hcp)
        this.emitHcpChanged(this.hcp)
      }
      if ('theme' in partial) {
        this.emitThemeChanged(this.theme)
      }
    },
    async clearAll() {
      this.hcp = null
      this.targetHcp = null
      this.targetDate = null
      this.handedness = 'right'
      this.name = ''
      this.language = 'de'
      this.units = 'metric'
      this.theme = 'system'
      this.sounds = true
      this.shuffleFavorites = false
      this.notifications = false
      this.onboardingDone = false
      this.hcpHintDismissed = false
      this.lastBackupAt = null
      this.lastBackupCount = 0
      this.backupSnoozedUntil = null
      await this.persist()
      this.emitHcpChanged(this.hcp)
      this.emitThemeChanged(this.theme)
    },
  },
})
