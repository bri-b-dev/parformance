import { HCP_MAX, HCP_MIN } from '@/stores/settings'

/**
 * Golf notation: handicaps better than scratch ("plus handicaps") are stored as negative numbers
 * and shown with a plus sign, e.g. -2.5 -> "+2,5"; everything else with a decimal comma: 24.5 -> "24,5".
 */
export function formatHcp(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  const abs = (Math.round(Math.abs(value) * 10) / 10).toFixed(1).replace('.', ',')
  return value < 0 ? `+${abs}` : abs
}

export type ParsedHcp = { ok: true; value: number | null } | { ok: false }

/**
 * Parses what a player types: "24,5", "24.5", "+2,5" (plus handicap) or "-2,5" (same value).
 * Empty input is valid (null); anything else that is not a number in range is invalid.
 */
export function parseHcp(text: string): ParsedHcp {
  const t = text.trim().replace(/\s+/g, '').replace(',', '.')
  if (t === '') return { ok: true, value: null }
  if (!/^[+-]?\d{1,2}(\.\d{0,2})?$/.test(t)) return { ok: false }
  const n = Number(t)
  const value = t.startsWith('+') ? -n : n
  const rounded = Math.round(value * 10) / 10
  return rounded >= HCP_MIN && rounded <= HCP_MAX ? { ok: true, value: Object.is(rounded, -0) ? 0 : rounded } : { ok: false }
}

export function clampHcp(value: number): number {
  return Math.min(HCP_MAX, Math.max(HCP_MIN, Math.round(value * 10) / 10))
}
