import { createI18n } from 'vue-i18n'
import { de as handicapDe } from '@/modules/handicap/locales/de'
import { en as handicapEn } from '@/modules/handicap/locales/en'
import { appDe } from '@/locales/de'
import { appEn } from '@/locales/en'

// App shell messages live under `app`, the handicap module keeps its flat keys.
// The active locale is mirrored from the app setting `language` (see App.vue).
export const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages: { de: { ...handicapDe, app: appDe }, en: { ...handicapEn, app: appEn } },
  warnHtmlMessage: false,
})
