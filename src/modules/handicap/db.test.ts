import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { ScoreDiffDB } from './db'

beforeEach(async () => {
  await Dexie.delete('ScoreDiffDB')
})

/** Creates a database as the app left it at schema version 4. */
async function seedV4(rows: object[]) {
  const old = new Dexie('ScoreDiffDB')
  old.version(1).stores({ results: '++id, date, courseName, grossScore, scoreDifferential' })
  old.version(2).stores({ settings: '&key' })
  old.version(3).stores({ importedKeys: '&key' })
  old.version(4).stores({
    results: '++id, date, courseName, grossScore, scoreDifferential, importKey',
    importedKeys: null,
  })
  await old.table('results').bulkAdd(rows)
  old.close()
}

describe('schema v5 migration', () => {
  it('moves "<CR>/<Slope>" of manual rounds into courseRating/slope', async () => {
    await seedV4([
      { date: '2025-01-01', courseName: '72/113', grossScore: 90, scoreDifferential: 16, storedHandicap: 14 },
      { date: '2025-02-01', courseName: 'Golfclub Musterstadt', grossScore: 85, scoreDifferential: 12, storedHandicap: 12 },
      { date: '2025-03-01', courseName: 'Club - Turnier', grossScore: 80, scoreDifferential: 9, storedHandicap: 10, importKey: '2025-03-01|Club - Turnier' },
    ])
    const db = new ScoreDiffDB()
    const rows = await db.results.orderBy('date').toArray()

    expect(rows[0]).toMatchObject({ courseName: '72/113', courseRating: 72, slope: 113 })
    expect(rows[0].holes).toBeUndefined()
    expect(rows[1].courseRating).toBeUndefined()
    expect(rows[2].courseRating).toBeUndefined() // imported rows cannot be recovered
    expect(rows[1].grossScore).toBe(85) // untouched
    db.close()
  })
})

describe('course templates', () => {
  it('survive a restart (re-opening the database)', async () => {
    let db = new ScoreDiffDB()
    await db.courseTemplates.add({ name: 'Course X', tee: 'blue', holes: 9, courseRating: 35.2, slope: 120 })
    db.close()

    db = new ScoreDiffDB()
    const all = await db.courseTemplates.toArray()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ name: 'Course X', tee: 'blue', holes: 9, courseRating: 35.2, slope: 120 })
    db.close()
  })

  it('editing or deleting a template does not change existing rounds', async () => {
    const db = new ScoreDiffDB()
    const tplId = await db.courseTemplates.add({ name: 'Course X', tee: 'blue', holes: 18, courseRating: 72, slope: 130 })
    const tpl = (await db.courseTemplates.get(tplId))!
    // a round copies the template values (no reference)
    const roundId = await db.results.add({
      date: '2025-05-01', courseName: tpl.name, grossScore: 90, scoreDifferential: 15, storedHandicap: 15,
      holes: tpl.holes, courseRating: tpl.courseRating, slope: tpl.slope, tee: tpl.tee,
    })

    await db.courseTemplates.update(tplId, { courseRating: 70, slope: 125 })
    expect(await db.results.get(roundId)).toMatchObject({ courseRating: 72, slope: 130 })

    await db.courseTemplates.delete(tplId)
    expect(await db.results.get(roundId)).toMatchObject({ courseName: 'Course X', courseRating: 72, slope: 130 })
    db.close()
  })
})
