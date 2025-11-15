export type Trend = 'up' | 'down' | 'flat' | 'na'

export interface MovingAverageTrend {
  maLast5: number | null
  maPrev5: number | null
  trend: Trend
}

const EPS = 1e-6

function avg(nums: number[]): number | null {
  const filtered = (nums || []).filter(n => typeof n === 'number' && isFinite(n))
  if (filtered.length === 0) return null
  const sum = filtered.reduce((a, b) => a + b, 0)
  return sum / filtered.length
}

/**
 * Compute moving averages for the last 5 values and the previous 5 values,
 * and derive a trend symbol.
 *
 * Rules:
 * - maLast5: average of the last 5 finite values when at least 5 values exist; else null
 * - maPrev5: average of the 5 values immediately preceding the last 5 (requires >= 10 values); else null
 * - trend:
 *   - 'na' when one or both MAs are missing
 *   - 'up' when maLast5 > maPrev5 (with small epsilon)
 *   - 'down' when maLast5 < maPrev5 (with small epsilon)
 *   - 'flat' when the two averages are effectively equal (|diff| <= EPS)
 */
export function getMovingAverageTrend(values: number[]): MovingAverageTrend {
  const data = (values || []).filter(v => typeof v === 'number' && isFinite(v))
  const n = data.length

  let maLast5: number | null = null
  let maPrev5: number | null = null

  if (n >= 5) {
    maLast5 = avg(data.slice(n - 5))
  }
  if (n >= 10) {
    maPrev5 = avg(data.slice(n - 10, n - 5))
  }

  let trend: Trend = 'na'
  if (maLast5 != null && maPrev5 != null) {
    const diff = maLast5 - maPrev5
    if (diff > EPS) trend = 'up'
    else if (diff < -EPS) trend = 'down'
    else trend = 'flat'
  }

  return { maLast5, maPrev5, trend }
}
