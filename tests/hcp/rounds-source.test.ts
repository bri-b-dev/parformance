import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { hcpAtDate, roundsToSeries } from '@/hcp/sources/rounds'
import { useHcpSource } from '@/hcp/source'
import { useRoundsStore } from '@/stores/rounds'
import { useSettingsStore } from '@/stores/settings'
import { evaluateSessionLevel } from '@/hcp/evaluator'
import { useCurrentHcp } from '@/composables/useCurrentHcp'
import SettingsForm from '@/components/settings/SettingsForm.vue'
import { db } from '@/modules/handicap/db'
import type { Drill, Session } from '@/types'

const round = (date: string, storedHandicap: number, id?: number) =>
  ({ date, courseName: 'GC', grossScore: 90, scoreDifferential: storedHandicap, storedHandicap, ...(id ? { id } : {}) })

async function until(cond: () => boolean, ms = 2000) {
  const t0 = Date.now()
  while (!cond() && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 20))
}

describe('series helpers', () => {
  it('sorts rounds and drops unusable ones', () => {
    const s = roundsToSeries([
      { date: '2026-06-01', storedHandicap: 20 },
      { date: '2026-01-01', storedHandicap: 30 },
      { date: 'x', storedHandicap: 1 },
      { date: '2026-03-01', storedHandicap: NaN },
    ])
    expect(s).toEqual([{ date: '2026-01-01', hcp: 30 }, { date: '2026-06-01', hcp: 20 }])
  })
  it('returns the index after the latest round on or before the date', () => {
    const s = [{ date: '2026-01-01', hcp: 30 }, { date: '2026-06-01', hcp: 20 }]
    expect(hcpAtDate(s, '2025-12-31T10:00:00.000Z')).toBeNull()
    expect(hcpAtDate(s, '2026-03-15T10:00:00.000Z')).toBe(30)
    expect(hcpAtDate(s, '2026-06-01T18:00:00.000Z')).toBe(20)
    expect(hcpAtDate(s, undefined)).toBeNull()
  })
})

describe('HCP from rounds', () => {
  beforeEach(async () => { await db.results.clear() })

  it('takes over from the manual value as soon as rounds exist and follows new rounds', async () => {
    const settings = useSettingsStore()
    settings.hcp = 40
    const rounds = useRoundsStore()
    await rounds.start()
    await until(() => rounds.loaded)
    expect(useHcpSource().kind).toBe('manual')
    expect(useCurrentHcp().hcp.value).toBe(40)

    await db.results.add(round('2026-01-10', 30))
    await until(() => rounds.hasRounds)
    expect(useHcpSource().kind).toBe('rounds')
    expect(useCurrentHcp().hcp.value).toBe(30)

    await db.results.add(round('2026-02-10', 25))
    await until(() => rounds.series.length === 2)
    expect(useCurrentHcp().hcp.value).toBe(25)
    expect(useCurrentHcp().fromRounds.value).toBe(true)
  })

  it('evaluates an older session with the HCP of that time', async () => {
    const rounds = useRoundsStore()
    await rounds.start()
    await db.results.bulkAdd([round('2026-01-10', 40), round('2026-06-10', 15)])
    await until(() => rounds.series.length === 2)
    const drill = { id: 'd', metric: { type: 'streak', unit: 'x', hcpTargets: { '54-30': [1, 2, 3], '29-0': [5, 6, 7] } } } as unknown as Drill
    const session = { id: 's', drillId: 'd', date: '2026-02-01T10:00:00.000Z', hcp: null, result: { value: 2, unit: 'x' } } as Session
    expect(evaluateSessionLevel(session, drill, 'historical')).toBe(2) // HCP 40 then
    expect(evaluateSessionLevel(session, drill, 'current')).toBe(0) // HCP 15 now
  })

  it('locks the manual HCP field in the settings form while derived from rounds', async () => {
    const w = mount(SettingsForm, { props: { modelValue: { hcp: 40 }, derivedHcp: 18.4 } })
    await flushPromises()
    const input = w.find('#settings-hcp')
    expect((input.element as HTMLInputElement).disabled).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('18.4')
    expect(w.text()).toMatch(/aus deinen Runden berechnet/i)
    const w2 = mount(SettingsForm, { props: { modelValue: { hcp: 40 } } })
    expect((w2.find('#settings-hcp').element as HTMLInputElement).disabled).toBe(false)
  })
})
