import type { Drill } from '@/types'

export interface PickOptions {
  /** Drill ids to avoid (last sessions, earlier picks in this overlay). Ignored if that would leave nothing. */
  recent: string[]
  favorites: Set<string>
  biasFavorites: boolean
  /** Random source in [0, 1); injectable for tests. */
  rnd?: () => number
}

/** Cryptographically seeded random in [0, 1) where available. */
export function secureRandom(): number {
  const c = globalThis.crypto
  if (c?.getRandomValues) {
    const a = new Uint32Array(1)
    c.getRandomValues(a)
    return a[0] / 0x1_0000_0000
  }
  return Math.random()
}

/**
 * Pick a drill from the pool: favorites are weighted higher when enabled (10x, 3x in tiny pools)
 * and drills in `recent` are avoided as long as other drills remain.
 */
export function pickRandomDrill(pool: Drill[], opts: PickOptions): Drill | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]
  const rnd = opts.rnd ?? secureRandom
  const avoid = new Set(opts.recent)
  let candidates = pool.filter(d => !avoid.has(d.id))
  if (candidates.length === 0) {
    // everything was seen recently: only avoid repeating the very last pick
    const last = opts.recent[opts.recent.length - 1]
    candidates = pool.filter(d => d.id !== last)
  }
  const factor = pool.length <= 3 ? 3 : 10
  const weights = candidates.map(d => (opts.biasFavorites && opts.favorites.has(d.id) ? factor : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r < 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
