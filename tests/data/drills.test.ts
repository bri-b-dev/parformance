import { describe, expect, it } from 'vitest'
import drills from '@/data/drills.json'
import type { Drill } from '@/types'

const catalog = drills as unknown as Drill[]

describe('drill catalog thresholds', () => {
  it('has unique ids', () => {
    const ids = catalog.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // Level = number of thresholds met, so their order does not matter, but duplicates would
  // silently collapse levels.
  it('array thresholds have distinct values', () => {
    const bad: string[] = []
    for (const d of catalog) {
      for (const [bucket, v] of Object.entries(d.metric.hcpTargets ?? {})) {
        if (Array.isArray(v) && new Set(v).size !== v.length) bad.push(`${d.id} ${bucket}: [${v.join(', ')}]`)
      }
    }
    expect(bad).toEqual([])
  })
})
