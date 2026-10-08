import { describe, it, expect } from 'vitest'
import { emptyTemplateForm, templateLabel, toTemplate, validateTemplate } from './courseTemplate'

const valid = { name: 'Course X', tee: 'blue', holes: 9, courseRating: 35.2, slope: 120, par: null }

describe('validateTemplate', () => {
  it('accepts a complete template (par optional)', () => {
    expect(validateTemplate(valid)).toEqual({})
  })

  it('flags missing/invalid fields', () => {
    expect(validateTemplate(emptyTemplateForm())).toEqual({ name: true, courseRating: true, slope: true })
    expect(validateTemplate({ ...valid, holes: '' })).toEqual({ holes: true })
    expect(validateTemplate({ ...valid, slope: 200 })).toEqual({ slope: true })
    expect(validateTemplate({ ...valid, par: -1 })).toEqual({ par: true })
  })
})

describe('toTemplate / templateLabel', () => {
  it('trims and omits empty par', () => {
    const t = toTemplate({ ...valid, name: '  Course X ', tee: ' blue ' })
    expect(t).toEqual({ name: 'Course X', tee: 'blue', holes: 9, courseRating: 35.2, slope: 120 })
  })

  it('builds a label', () => {
    expect(templateLabel({ name: 'Course X', tee: 'rot, Damen', holes: 9, courseRating: 1, slope: 1 })).toBe('Course X – rot, Damen (9)')
    expect(templateLabel({ name: 'Course X', tee: '', holes: 18, courseRating: 1, slope: 1 })).toBe('Course X (18)')
  })
})
