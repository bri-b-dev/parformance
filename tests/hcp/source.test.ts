import { describe, expect, it } from 'vitest'
import { useHcpSource } from '@/hcp/source'
import { useHcpHistoryStore } from '@/stores/hcpHistory'
import { useSettingsStore } from '@/stores/settings'
import { evaluateSessionLevel } from '@/hcp/evaluator'
import type { Drill, Session } from '@/types'

describe('manual HcpSource', () => {
  it('falls back to the settings HCP when there is no history', () => {
    useSettingsStore().hcp = 24
    const s = useHcpSource()
    expect(s.getLatest()).toBe(24)
    expect(s.getHcpAt('2026-01-01T00:00:00.000Z')).toBeNull()
  })

  it('prefers the history and returns the value valid at a date', async () => {
    const h = useHcpHistoryStore()
    await h.replaceAll([
      { id: 'a', hcp: 30, valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-06-01T00:00:00.000Z' },
      { id: 'b', hcp: 20, valid_from: '2026-06-01T00:00:00.000Z', valid_to: null },
    ])
    useSettingsStore().hcp = 99
    const s = useHcpSource()
    expect(s.getLatest()).toBe(20)
    expect(s.getHcpAt('2026-03-01T00:00:00.000Z')).toBe(30)
    expect(s.getSeries?.()).toEqual([
      { date: '2026-01-01T00:00:00.000Z', hcp: 30 },
      { date: '2026-06-01T00:00:00.000Z', hcp: 20 },
    ])
  })

  it('is what the evaluator uses (session hcp is the last fallback)', () => {
    const drill = { id: 'd', metric: { type: 'streak', unit: 'x', hcpTargets: { '54-30': [1, 2, 3], '29-0': [5, 6, 7] } } } as unknown as Drill
    const session = { id: 's', drillId: 'd', date: '2026-02-01T00:00:00.000Z', hcp: 40, result: { value: 2, unit: 'x' } } as Session
    useSettingsStore().hcp = 10
    expect(evaluateSessionLevel(session, drill, 'historical')).toBe(2) // session.hcp 40 -> bucket 54-30
    expect(evaluateSessionLevel(session, drill, 'current')).toBe(0) // settings hcp 10 -> bucket 29-0
  })
})

describe('hcpHistory.replaceAll', () => {
  it('sanitizes imported rows, sorts them and persists', async () => {
    const h = useHcpHistoryStore()
    await h.replaceAll([
      { hcp: 20, valid_from: '2026-06-01T00:00:00.000Z' },
      { id: 'x', hcp: 'bad', valid_from: '2026-01-01T00:00:00.000Z' },
      { id: 'y', hcp: 30, valid_from: 'not a date' },
      null,
      { id: 'z', hcp: 30, valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-06-01T00:00:00.000Z' },
    ])
    expect(h.rows.map(r => r.hcp)).toEqual([30, 20])
    expect(h.rows[1].id).toBeTruthy()
    expect(h.rows[1].valid_to).toBeNull()
  })
  it('clearAll empties the history', async () => {
    const h = useHcpHistoryStore()
    await h.replaceAll([{ id: 'a', hcp: 5, valid_from: '2026-01-01T00:00:00.000Z' }])
    await h.clearAll()
    expect(h.rows).toEqual([])
  })
})
