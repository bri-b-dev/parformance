import { useSettingsStore } from '@/stores/settings'

/** BCP-47 tag for `Intl`, following the app setting. */
export const intlTag = (language: 'de' | 'en') => (language === 'en' ? 'en-GB' : 'de-DE')

export function currentIntlTag() {
  return intlTag(useSettingsStore().language)
}
