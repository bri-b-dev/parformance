export function computeBaseHandicap(diffs, prevHC = null) {
  const n = diffs.length
  if (n === 0) return 0
  let count, adj
  if (n <= 3) { count = 1; adj = -2.0 }
  else if (n === 4) { count = 1; adj = -1.0 }
  else if (n === 5) { count = 1; adj = 0.0 }
  else if (n === 6) { count = 2; adj = -1.0 }
  else if (n <= 8) { count = 2; adj = 0.0 }
  else if (n <= 11) { count = 3; adj = 0.0 }
  else if (n <= 14) { count = 4; adj = 0.0 }
  else if (n <= 16) { count = 5; adj = 0.0 }
  else if (n <= 18) { count = 6; adj = 0.0 }
  else if (n === 19) { count = 7; adj = 0.0 }
  else { count = 8; adj = 0.0 }
  const avg = diffs.slice(0, count).reduce((sum, v) => sum + v, 0) / count
  let hc = parseFloat((avg + adj).toFixed(1))
  if (prevHC !== null && prevHC >= 26.5 && prevHC <= 54 && hc > prevHC) {
    hc = prevHC
  }
  return hc
}