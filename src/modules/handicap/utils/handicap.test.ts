import { describe, it, expect } from 'vitest'
import { calculateHistory, projectHandicap } from './handicap'

const round = (id: number, date: string, sd: number) => ({ id, date, scoreDifferential: sd })

// n rounds on consecutive days with the given differentials
function rounds(sds: number[]) {
  return sds.map((sd, i) => round(i + 1, new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), sd))
}

describe('calculateHistory', () => {
  it('returns an empty array without rounds', () => {
    expect(calculateHistory([])).toEqual([])
  })

  it('sorts ascending by date and computes the index after each round', () => {
    const h = calculateHistory([round(2, '2025-02-01', 20), round(1, '2025-01-01', 10)])
    expect(h.map((e) => e.id)).toEqual([1, 2])
    expect(h[0].storedHandicap).toBe(8) // 1 round: 10 - 2
    expect(h[1].storedHandicap).toBe(8) // 2 rounds: best 10 - 2
  })

  it('uses only the most recent 20 rounds', () => {
    // 5 great old rounds (SD 0), then 20 rounds at SD 20 -> old rounds must drop out of the window
    const h = calculateHistory(rounds([...Array(5).fill(0), ...Array(20).fill(20)]))
    expect(h.slice(0, 5).some((e) => e.counting)).toBe(false)
    expect(h.filter((e) => e.counting)).toHaveLength(8)
  })

  it('marks exactly the best N of the window as counting (20+ rounds -> 8)', () => {
    const sds = Array.from({ length: 25 }, (_, i) => 30 - i) // decreasing: newest is best
    const h = calculateHistory(rounds(sds))
    const counting = h.filter((e) => e.counting)
    expect(counting).toHaveLength(8)
    // window = last 20 rounds (ids 6..25), best 8 = lowest SDs = the 8 newest
    expect(counting.map((e) => e.id)).toEqual([18, 19, 20, 21, 22, 23, 24, 25])
  })

  it.each([
    [1, 1],
    [5, 1],
    [6, 2],
    [9, 3],
    [12, 4],
    [15, 5],
    [17, 6],
    [19, 7],
    [20, 8],
  ])('marks the WHS number of counting rounds for %i rounds -> %i', (n, expected) => {
    const h = calculateHistory(rounds(Array.from({ length: n }, (_, i) => 10 + i)))
    expect(h.filter((e) => e.counting)).toHaveLength(expected)
  })

  it('the counting rounds reproduce the latest index', () => {
    const sds = [14.2, 9.1, 18.0, 11.5, 12.3, 20.1, 8.8, 15.0, 13.3, 10.0, 16.4, 9.9]
    const h = calculateHistory(rounds(sds))
    const counting = h.filter((e) => e.counting).map((e) => e.scoreDifferential)
    const avg = counting.reduce((a, b) => a + b, 0) / counting.length
    expect(parseFloat(avg.toFixed(1))).toBe(h[h.length - 1].storedHandicap)
  })

  it('does not mutate the input', () => {
    const input = rounds([10, 12])
    const copy = JSON.parse(JSON.stringify(input))
    calculateHistory(input)
    expect(input).toEqual(copy)
  })
})

describe('projectHandicap', () => {
  it('matches the history result once the round is added', () => {
    const existing = rounds([12, 14, 11, 15, 13])
    const added = { date: '2025-03-01', scoreDifferential: 9 }
    const projected = projectHandicap(existing, added)
    const h = calculateHistory([...existing, { id: 99, ...added }])
    expect(projected).toBe(h[h.length - 1].storedHandicap)
  })

  it('works for a round dated before existing ones', () => {
    const existing = rounds([12, 14])
    expect(projectHandicap(existing, { date: '2024-01-01', scoreDifferential: 5 })).toBe(3) // 5 - 2
  })
})
