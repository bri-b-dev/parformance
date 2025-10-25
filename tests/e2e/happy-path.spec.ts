import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { makeRouter } from '../../src/router'
import { createMemoryHistory } from 'vue-router'
import { useDrillCatalogStore } from '../../src/stores/drillCatalog'
import { useSessionsStore } from '../../src/stores/sessions'

class LocalStorageMock {
  store: Record<string, string> = {}
  getItem(key: string) { return this.store[key] ?? null }
  setItem(key: string, value: string) { this.store[key] = value }
  removeItem(key: string) { delete this.store[key] }
  clear() { this.store = {} }
  key(i: number) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

declare global { var window: any }

describe('Happy path: open → pick drill → start session → save → see history', () => {
  beforeEach(() => {
    // Pinia fresh instance
    setActivePinia(createPinia())

    // Minimal browser-ish globals for stores that check window/localStorage
    // @ts-expect-error set global
    global.window = { localStorage: new LocalStorageMock(), dispatchEvent: () => {} }

    vi.useFakeTimers()
  })

  it('runs headlessly and deterministically', async () => {
    // 1) Open app → router to drills list (memory history for headless)
    const router = makeRouter(createMemoryHistory())
    await router.push('/drills')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/drills')

    // 2) Load drill catalog and pick a drill
    const catalog = useDrillCatalogStore()
    await catalog.load()
    expect(catalog.loaded).toBe(true)
    expect(catalog.drills.length).toBeGreaterThan(0)

    const drill = catalog.drills[0]
    const drillId = drill.id

    // Navigate to drill detail deep link
    await router.push(`/drill/${encodeURIComponent(drillId)}`)
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('DrillDetail')
    expect(router.currentRoute.value.params.id).toBe(drillId)

    // 3) Start session → 4) Save session (use fixed values for determinism)
    const sessions = useSessionsStore()
    await sessions.load()
    expect(sessions.sessions).toEqual([])

    const fixedDate = '2025-01-01T12:00:00.000Z'
    const unit = drill.metric.unit

    // Provide explicit id to avoid dependency on crypto.randomUUID
    await sessions.addSession({
      id: 'sess_e2e_1',
      drillId,
      date: fixedDate,
      hcp: 18,
      result: { value: 5, unit },
    })

    // Debounced persist not yet written
    const key = 'parformance.sessions.v1'
    expect(global.window.localStorage.store[key]).toBeUndefined()

    // Flush timers to perform debounced write
    vi.runOnlyPendingTimers()

    // Verify persisted
    const persisted = JSON.parse(global.window.localStorage.store[key])
    expect(persisted.length).toBe(1)
    expect(persisted[0].id).toBe('sess_e2e_1')

    // 5) See history: listByDrill and latestByDrill
    const list = sessions.listByDrill(drillId)
    expect(list.length).toBe(1)
    expect(list[0].drillId).toBe(drillId)

    const latest = sessions.latestByDrill(drillId)
    expect(latest?.date).toBe(fixedDate)
  })
})
