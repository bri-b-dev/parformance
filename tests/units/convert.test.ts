import { describe, expect, it } from 'vitest'
import { convertUnitsInText } from '@/units/convert'
import { appDe } from '@/locales/de'
import { appEn } from '@/locales/en'
import drills from '@/data/drills.json'

describe('convertUnitsInText', () => {
  it('leaves metric text untouched', () => {
    expect(convertUnitsInText('Putte aus 5 m', 'metric')).toBe('Putte aus 5 m')
  })
  it('converts distances and ranges to yards', () => {
    expect(convertUnitsInText('Putte aus 5 m', 'imperial')).toBe('Putte aus 5,5 yd')
    expect(convertUnitsInText('20-40 Meter Abstand', 'imperial')).toBe('22–44 yd Abstand')
  })
  it('converts speeds and does not mistake km/h or min for metres', () => {
    expect(convertUnitsInText('Tempo 100 km/h', 'imperial')).toBe('Tempo 62 mph')
    expect(convertUnitsInText('5 min lang, 3 Meter', 'imperial')).toBe('5 min lang, 3,3 yd')
  })
  it('uses the locale number format', () => {
    expect(convertUnitsInText('5 m', 'imperial', 'en-GB')).toBe('5.5 yd')
  })
  it('never throws on any drill text', () => {
    for (const d of drills as any[]) for (const t of [d.instructions?.training, d.instructions?.test, d.instructions?.tooEasy]) expect(() => convertUnitsInText(t ?? '', 'imperial')).not.toThrow()
  })
})

describe('messages', () => {
  const keys = (o: any, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
  it('de and en have the same keys', () => {
    expect(keys(appEn).sort()).toEqual(keys(appDe).sort())
  })
})
