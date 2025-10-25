// Generic weighted random picker with fallback to uniform when weights are missing or invalid.
// Returns one of the provided items. Weights <= 0 are treated as 0.
export function pickWeighted<T>(items: T[], weightFn?: (item: T) => number): T | null {
  const n = Array.isArray(items) ? items.length : 0
  if (n === 0) return null
  if (!weightFn) return items[Math.floor(Math.random() * n)]

  let total = 0
  const weights = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const w = Math.max(0, Math.floor(Number(weightFn(items[i])) || 0))
    weights[i] = w
    total += w
  }
  if (total <= 0) return items[Math.floor(Math.random() * n)]

  let r = Math.random() * total
  for (let i = 0; i < n; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  // Fallback (numerical precision): return last item
  return items[n - 1]
}

export default { pickWeighted }
