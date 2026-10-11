export type Units = 'metric' | 'imperial'

const YD_PER_M = 1.0936133
const MPH_PER_KMH = 0.6213712

const num = (s: string) => Number(s.replace(',', '.'))

/** Natural rounding for distances: whole numbers, one decimal below 10 yd. */
function round(value: number, step = 1) {
  return Math.round(value / step) * step
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
}

const toYards = (m: number) => (m < 10 ? Math.round(m * YD_PER_M * 10) / 10 : round(m * YD_PER_M))

/**
 * Drill texts are free text with metric values ("5 m", "10-20 m", "100 km/h").
 * Convert them when the player chose imperial units; metric text passes through untouched.
 */
export function convertUnitsInText(text: string, units: Units, locale = 'de'): string {
  if (units !== 'imperial' || !text) return text
  const n = '(\\d+(?:[.,]\\d+)?)'
  return text
    // km/h before m so "km/h" is not read as a distance
    .replace(new RegExp(`${n}(?:\\s?[-–]\\s?${n})?\\s?km/h`, 'g'), (_m, a: string, b?: string) =>
      b ? `${formatNumber(round(num(a) * MPH_PER_KMH), locale)}–${formatNumber(round(num(b) * MPH_PER_KMH), locale)} mph` : `${formatNumber(round(num(a) * MPH_PER_KMH), locale)} mph`)
    .replace(new RegExp(`${n}(?:\\s?[-–]\\s?${n})?\\s?(?:m|Meter)(?![A-Za-zÄÖÜäöüß/])`, 'g'), (_m, a: string, b?: string) =>
      b ? `${formatNumber(toYards(num(a)), locale)}–${formatNumber(toYards(num(b)), locale)} yd` : `${formatNumber(toYards(num(a)), locale)} yd`)
}

/** Short label of the distance unit, for forms and legends. */
export const distanceUnit = (units: Units) => (units === 'imperial' ? 'yd' : 'm')
