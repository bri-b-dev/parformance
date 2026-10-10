import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { activeFocus, dayKey, daysUntilEnd } from '@/focus/active'
import { useFocusStore } from '@/stores/focus'

const base = { createdAt: '2026-10-01T10:00:00.000Z' }

describe('activeFocus', () => {
  const now = new Date(2026, 9, 10, 12)
  it('applies from the start day until the planned end day (inclusive)', () => {
    const f = { id: 'a', from: '2026-10-10', to: '2026-10-10', ...base }
    expect(activeFocus([f], now)?.id).toBe('a')
    expect(activeFocus([{ ...f, from: '2026-10-11' }], now)).toBeUndefined()
    expect(activeFocus([{ ...f, to: '2026-10-09' }], now)).toBeUndefined()
    expect(activeFocus([{ id: 'b', from: '2026-10-01', ...base }], now)?.id).toBe('b')
  })
  it('ignores ended focus points and prefers the latest start', () => {
    const items = [
      { id: 'old', from: '2026-09-01', ...base },
      { id: 'ended', from: '2026-10-05', endedAt: '2026-10-06T00:00:00.000Z', ...base },
      { id: 'new', from: '2026-10-08', ...base },
    ]
    expect(activeFocus(items, now)?.id).toBe('new')
    expect(activeFocus(items.slice(1, 2), now)).toBeUndefined()
  })
  it('counts days until the end', () => {
    const now2 = new Date(2026, 9, 10, 23, 30)
    expect(daysUntilEnd({ to: '2026-10-10' }, now2)).toBe(0)
    expect(daysUntilEnd({ to: '2026-10-17' }, now2)).toBe(7)
    expect(daysUntilEnd({}, now2)).toBeNull()
    expect(dayKey(now2)).toBe('2026-10-10')
  })
})

describe('focus store', () => {
  it('starts a focus, ends the previous one, edits and persists', async () => {
    const s = useFocusStore()
    const a = s.start({ label: '  Tempo ' })!
    expect(a.label).toBe('Tempo')
    expect(s.active?.id).toBe(a.id)
    const b = s.start({ label: 'Lag-Putting', collectionId: 'c1', to: '2099-01-01' })!
    expect(s.active?.id).toBe(b.id)
    expect(s.byId(a.id)?.endedAt).toBeTruthy()
    expect(s.update(b.id, { label: 'Lag-Putting 10-15 m', collectionId: undefined })).toBe(true)
    expect(s.byId(b.id)).toMatchObject({ label: 'Lag-Putting 10-15 m', collectionId: undefined, to: '2099-01-01' })

    setActivePinia(createPinia())
    const fresh = useFocusStore()
    await fresh.load()
    expect(fresh.items).toHaveLength(2)
    expect(fresh.active?.label).toBe('Lag-Putting 10-15 m')
    fresh.end(b.id)
    expect(fresh.active).toBeUndefined()
    expect(fresh.list[0].id).toBe(b.id)
  })

  it('rejects empty labels and sanitizes imports', () => {
    const s = useFocusStore()
    expect(s.start({ label: '   ' })).toBeNull()
    s.replaceAll([{ label: 'Ok', from: 'bad', to: '2026-13-45' }, { label: '' }, null, 'x'])
    expect(s.items).toHaveLength(1)
    expect(s.items[0].to).toBeUndefined()
    expect(s.items[0].from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    s.clearAll()
    expect(s.items).toEqual([])
  })
})
