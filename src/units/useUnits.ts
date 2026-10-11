import { useSettingsStore } from '@/stores/settings'
import { convertUnitsInText } from './convert'
import { intlTag } from '@/utils/locale'

/** `u(text)` renders drill text in the player's units. */
export function useUnits() {
  const settings = useSettingsStore()
  return { u: (text: string) => convertUnitsInText(text, settings.units, intlTag(settings.language)) }
}
