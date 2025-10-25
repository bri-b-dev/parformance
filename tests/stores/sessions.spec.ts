import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionsStore } from '../../src/stores/sessions'
import type { Session } from '../../src/types'

const makeSession = (overrides?: Partial<Session>): Session => ({
  id: overrides?.id ?? `sess_${Math.random().toString(36).slice(2)}`,
  drillId: overrides?.drillId ?? 'putting_360',
  date: overrides?.date ?? new Date().toISOString(),
  hcp: overrides?.hcp ?? 18,
  result: overrides?.result ?? { value: 10, unit: 'pts' },
  timerUsed: overrides?.timerUsed,
  attempts: overrides?.attempts,
  levelReached: overrides?.levelReached,
  favorited: overrides?.favorited,
  notes: overrides?.notes,
})

describe('useSessionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addSession(session) adds a new session and returns it', async () => {
    const store = useSessionsStore()
    expect(store.sessions.length).toBe(0)

    const created = await store.addSession({
      // omit id to verify it is generated
      drillId: 'chip_carry_zone',
      date: '2025-10-25T10:32:00Z',
      hcp: 12,
      result: { value: 7, unit: 'Zonen in Serie' },
    })

    expect(created.id).toBeTruthy()
    expect(store.sessions.length).toBe(1)
    expect(store.sessions[0]).toEqual(created)
  })

  it('listByDrill(drillId) returns sessions for that drill, sorted by date desc', async () => {
    const store = useSessionsStore()
    const s1 = makeSession({ drillId: 'd1', date: '2025-01-01T10:00:00Z' })
    const s2 = makeSession({ drillId: 'd1', date: '2025-05-01T10:00:00Z' })
    const s3 = makeSession({ drillId: 'd2', date: '2025-03-01T10:00:00Z' })

    // push directly to avoid persisting during unit test and to control order
    store.sessions = [s1, s2, s3]

    const listD1 = store.listByDrill('d1')
    expect(listD1.map(s => s.id)).toEqual([s2.id, s1.id])

    const listD2 = store.listByDrill('d2')
    expect(listD2).toEqual([s3])

    const listDx = store.listByDrill('none')
    expect(listDx).toEqual([])
  })

  it('latestByDrill(drillId) returns the most recent matching session or undefined', async () => {
    const store = useSessionsStore()
    const s1 = makeSession({ drillId: 'd1', date: '2025-01-01T10:00:00Z' })
    const s2 = makeSession({ drillId: 'd1', date: '2025-05-01T10:00:00Z' })
    const s3 = makeSession({ drillId: 'd1', date: '2024-12-31T10:00:00Z' })
    const s4 = makeSession({ drillId: 'd2', date: '2025-06-01T10:00:00Z' })
    store.sessions = [s1, s2, s3, s4]

    expect(store.latestByDrill('d1')).toEqual(s2)
    expect(store.latestByDrill('d2')).toEqual(s4)
    expect(store.latestByDrill('none')).toBeUndefined()
  })
})
