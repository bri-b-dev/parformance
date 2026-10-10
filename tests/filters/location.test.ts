import { describe, expect, it } from 'vitest'
import drills from '@/data/drills.json'
import { locationGroup } from '@/filters/location'
import type { Drill } from '@/types'

const loc = (location: string) => locationGroup({ setup: { schema: '', location } } as Drill)

describe('locationGroup', () => {
  it.each([
    ['Putting Green', 'Putting'], ['Grün', 'Putting'], ['Chipping Green', 'Kurzspiel'], ['Pitch-Area oder Fairway mit Zielgrün', 'Kurzspiel'],
    ['Übungsbunker oder Grünbunker mit Zielgrün', 'Bunker'], ['Driving Range', 'Range'], ['Range/Approach-Zone', 'Range'],
    ['Golfplatz oder Range mit klaren Fairwaygrenzen', 'Platz'], ['Platz', 'Platz'], ['irgendwo', 'Sonstige'],
  ])('%s -> %s', (input, expected) => expect(loc(input)).toBe(expected))

  it('assigns every catalog drill to a real group', () => {
    const unknown = (drills as unknown as Drill[]).filter(d => locationGroup(d) === 'Sonstige').map(d => d.id)
    expect(unknown).toEqual([])
  })
})
