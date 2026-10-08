/** Anzahl der jüngsten Runden, die in die Berechnung eingehen (WHS). */
export const WHS_WINDOW = 20

/**
 * WHS-Tabelle: wie viele der besten Differentials zählen bei n Runden und welche Anpassung gilt.
 */
export function getCalculationRule(n: number): { count: number; adj: number } {
  if (n <= 3) return { count: 1, adj: -2.0 }
  if (n === 4) return { count: 1, adj: -1.0 }
  if (n === 5) return { count: 1, adj: 0.0 }
  if (n === 6) return { count: 2, adj: -1.0 }
  if (n <= 8) return { count: 2, adj: 0.0 }
  if (n <= 11) return { count: 3, adj: 0.0 }
  if (n <= 14) return { count: 4, adj: 0.0 }
  if (n <= 16) return { count: 5, adj: 0.0 }
  if (n <= 18) return { count: 6, adj: 0.0 }
  if (n === 19) return { count: 7, adj: 0.0 }
  return { count: 8, adj: 0.0 }
}

/**
 * Berechnet das Basis-Handicap (ohne Cap) aus einem aufsteigend sortierten Array von Score-Differentials.
 * @param diffs Score-Differentials der berücksichtigten Runden (aufsteigend sortiert).
 * @param prevHC Vorheriger Handicap-Index (oder null, wenn keiner vorhanden).
 * @returns Neues Handicap (gerundet auf eine Nachkommastelle).
 */
export function computeBaseHandicap(diffs: number[], prevHC: number | null = null): number {
  const n = diffs.length
  if (n === 0) return 0

  const { count, adj } = getCalculationRule(n)

  // Die kleinsten 'count' Differentials aufsummieren und den Durchschnitt berechnen
  const sumOfSmallest = diffs
    .slice(0, count)
    .reduce((sum: number, v: number) => sum + v, 0)
  const avg = sumOfSmallest / count

  let hc = parseFloat((avg + adj).toFixed(1))

  // Previous HC Cap (26.5-Regel)
  if (prevHC !== null && prevHC >= 26.5 && prevHC <= 54 && hc > prevHC) {
    hc = prevHC
  }

  return hc
}

/**
 * Wendet das Handicap-Cap-Verfahren (Soft-/Hard-Cap) auf ein berechnetes Handicap an.
 * @param newHC Neu berechnetes Handicap (Basiswert).
 * @param allRecords Array aller bisherigen Runden-Objekte (müssen zumindest { date: string; storedHandicap: number } enthalten).
 * @param currentIndex Index der gerade zu bewertenden Runde in allRecords.
 * @returns Gecapptes Handicap (number).
 */
export function applyCap(
  newHC: number,
  allRecords: Array<{ date: string; storedHandicap: number }>,
  currentIndex: number
): number {
  const currentDate = new Date(allRecords[currentIndex].date)
  const oneYearAgo = new Date(currentDate)
  oneYearAgo.setDate(currentDate.getDate() - 365)

  // Alle Runden innerhalb der letzten 365 Tage vor der aktuellen Runde
  const pastRounds = allRecords
    .slice(0, currentIndex)
    .filter((r) => new Date(r.date) >= oneYearAgo)

  const lowHI = pastRounds.length
    ? Math.min(...pastRounds.map((r) => r.storedHandicap))
    : newHC

  const diff = newHC - lowHI
  if (diff <= 3) return newHC

  // Soft Cap: +3 plus halbes Extra über 3
  const extra = diff - 3
  const softIncrease = 3 + extra / 2
  if (softIncrease <= 5) {
    return parseFloat((lowHI + softIncrease).toFixed(1))
  }

  // Hard Cap bei +5
  return lowHI + 5
}
