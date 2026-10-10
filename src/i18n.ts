import { createI18n } from 'vue-i18n'
import { de } from '@/modules/handicap/locales/de'
import { en } from '@/modules/handicap/locales/en'

// Messages of the handicap module for now; the rest of the UI is still hard-coded German (see UX-11).
// The active locale is mirrored from the app setting `language` (see HandicapShell).
export const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages: { de, en },
  warnHtmlMessage: false,
})
