import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRunStore } from '@/stores/run'
import type { Session } from '@/types'

const sess = (id: string, drillId: string, date: string): Session => ({ id, drillId, date, hcp: null, result: { value: 1, unit: 'x' } })

describe('run store', () => {
  it('does not start without drills', () => {
    expect(useRunStore().start({ title: 'x', drillIds: [] })).toBe(false)
    expect(useRunStore().run).toBeNull()
  })

  it('walks through steps: skip, complete, next, back and finish', () => {
    const r = useRunStore()
    r.start({ title: 'Test', drillIds: ['a', 'b', 'c'] })
    expect(r.total).toBe(3)
    expect(r.current?.drillId).toBe('a')
    r.skip()
    expect(r.run!.steps[0].status).toBe('skipped')
    expect(r.current?.drillId).toBe('b')
    r.complete('s1')
    expect(r.run!.steps[1]).toMatchObject({ status: 'done', sessionId: 's1' })
    r.complete('s2') // already done: ignored
    expect(r.run!.steps[1].sessionId).toBe('s1')
    r.next()
    expect(r.isLast).toBe(true)
    r.back()
    expect(r.current?.drillId).toBe('b')
    r.next()
    r.next() // last step -> finished
    expect(r.finished).toBe(true)
    expect(r.doneCount).toBe(1)
    r.clear()
    expect(r.run).toBeNull()
  })

  it('attaches only sessions saved after the start, once per step', () => {
    const r = useRunStore()
    r.start({ title: 'T', drillIds: ['a', 'a'] })
    const before = sess('old', 'a', new Date(Date.now() - 60_000).toISOString())
    r.attachSession([before])
    expect(r.current?.status).toBe('pending')
    const s1 = sess('s1', 'a', new Date(Date.now() + 1000).toISOString())
    r.attachSession([before, s1])
    expect(r.run!.steps[0]).toMatchObject({ status: 'done', sessionId: 's1' })
    r.next()
    r.attachSession([before, s1]) // s1 already used by step 1
    expect(r.current?.status).toBe('pending')
  })

  it('survives a restart', async () => {
    const r = useRunStore()
    r.start({ title: 'Persist', drillIds: ['a', 'b'], collectionId: 'c1' })
    r.complete('s1')
    r.next()

    setActivePinia(createPinia())
    const fresh = useRunStore()
    await fresh.load()
    expect(fresh.run).toMatchObject({ title: 'Persist', collectionId: 'c1', index: 1 })
    expect(fresh.run!.steps[0]).toMatchObject({ status: 'done', sessionId: 's1' })
  })
})
