import type { Session } from '@/types'

export interface ChartPoint {
  date: string
  value: number
  /** 0..1 along time */
  x: number
  /** 0..1, better results are higher */
  y: number
}

export interface ChartLine {
  level: 1 | 2 | 3
  value: number
  y: number
}

export interface SeriesModel {
  points: ChartPoint[]
  lines: ChartLine[]
  best: number
  first: number
  last: number
  /** For screen readers */
  summary: string
}

const DAY = 86_400_000
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/**
 * Results of one drill over time with the level thresholds as lines.
 * The y axis is oriented so that better is always higher (mirrored for "smaller is better").
 */
export function buildSeries(input: { sessions: Session[]; thresholds: number[]; smallerIsBetter: boolean; days: number; now?: Date }): SeriesModel | null {
  const now = (input.now ?? new Date()).getTime()
  const rows = input.sessions
    .map(s => ({ t: Date.parse(s.date), value: Number(s.result?.value), date: s.date }))
    .filter(r => Number.isFinite(r.t) && Number.isFinite(r.value) && (input.days <= 0 || r.t >= now - input.days * DAY))
    .sort((a, b) => a.t - b.t)
  if (rows.length === 0) return null

  const thr = input.thresholds.filter(Number.isFinite).slice(0, 3).sort((a, b) => (input.smallerIsBetter ? b - a : a - b))
  const all = [...rows.map(r => r.value), ...thr]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const pad = Math.max((hi - lo) * 0.1, 0.5)
  const min = lo - pad
  const max = hi + pad
  const y = (v: number) => (input.smallerIsBetter ? (max - v) / (max - min) : (v - min) / (max - min))

  const t0 = rows[0].t
  const t1 = rows[rows.length - 1].t
  const x = (t: number) => (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0))

  const values = rows.map(r => r.value)
  const best = input.smallerIsBetter ? Math.min(...values) : Math.max(...values)
  const first = values[0]
  const last = values[values.length - 1]
  const n = rows.length

  return {
    points: rows.map(r => ({ date: r.date, value: r.value, x: x(r.t), y: y(r.value) })),
    lines: thr.map((value, i) => ({ level: (i + 1) as 1 | 2 | 3, value, y: y(value) })),
    best,
    first,
    last,
    summary: `${n} ${n === 1 ? 'Ergebnis' : 'Ergebnisse'}, erstes ${fmt(first)}, letztes ${fmt(last)}, Bestwert ${fmt(best)}.`,
  }
}
