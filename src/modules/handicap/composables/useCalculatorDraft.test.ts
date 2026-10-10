import { describe, it, expect } from 'vitest'
import { createCalculatorDraft } from './useCalculatorDraft'

function memoryStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  }
}

describe('calculator draft', () => {
  it('keeps input in memory and in storage', () => {
    const storage = memoryStorage()
    const d = createCalculatorDraft(storage)
    d.courseRating.value = 71.4
    d.slope.value = 125
    expect(JSON.parse(storage.raw.get('calculatorDraft')!)).toMatchObject({ courseRating: 71.4, slope: 125 })
  })

  it('restores input from storage (page reload)', () => {
    const storage = memoryStorage()
    createCalculatorDraft(storage).grossScore.value = 88
    const d2 = createCalculatorDraft(storage)
    expect(d2.grossScore.value).toBe(88)
  })

  it('reset clears values and storage', () => {
    const storage = memoryStorage()
    const d = createCalculatorDraft(storage)
    d.grossScore.value = 88
    d.reset()
    expect(d.grossScore.value).toBeNull()
    expect(storage.raw.has('calculatorDraft')).toBe(false)
  })

  it('works without storage', () => {
    const d = createCalculatorDraft(undefined)
    d.slope.value = 120
    expect(d.slope.value).toBe(120)
  })

  it('ignores corrupt stored data', () => {
    const storage = memoryStorage()
    storage.setItem('calculatorDraft', '{nope')
    expect(createCalculatorDraft(storage).slope.value).toBeNull()
  })
})
