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

  // Radius-based targets cannot be expressed as numeric thresholds yet (see docs/DRILL_TARGET_MIGRATION.md).
  const DESCRIPTIVE_TARGETS = new Set(['pitching_attack_the_flag', 'pitching_mixed_clubs'])

  it('every drill can record a numeric result with level thresholds', () => {
    const bad: string[] = []
    for (const d of catalog) {
      if (typeof d.metric.unit !== 'string' || !d.metric.unit) bad.push(`${d.id}: unit`)
      if (DESCRIPTIVE_TARGETS.has(d.id)) continue
      const targets = Object.values(d.metric.hcpTargets ?? {})
      if (targets.length === 0 || !targets.every(v => Array.isArray(v) && v.length === 3)) bad.push(`${d.id}: targets`)
    }
    expect(bad).toEqual([])
  })

  it('thresholds lie inside the declared range', () => {
    const bad: string[] = []
    for (const d of catalog) {
      const r = d.metric.range
      if (!r) continue
      for (const v of Object.values(d.metric.hcpTargets ?? {})) {
        if (Array.isArray(v) && v.some(x => x < r[0] || x > r[1])) bad.push(d.id)
      }
    }
    expect(bad).toEqual([])
  })
})
