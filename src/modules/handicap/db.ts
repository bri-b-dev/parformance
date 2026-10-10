import Dexie from 'dexie'
import type { Table } from 'dexie'
import { parseLegacyCourseName } from './utils/legacyCourse'

export interface Result {
  id?: number
  date: string
  courseName: string
  grossScore: number
  scoreDifferential: number
  storedHandicap: number
  importKey?: string  // "<date>|<courseName-at-import-time>", set on PDF import, not shown in UI
  // Course data of the round (copied, never linked to a template). Missing on old rounds.
  holes?: number      // 9 or 18
  courseRating?: number
  slope?: number
  pcc?: number
  tee?: string
  par?: number
}

export interface CourseTemplate {
  id?: number
  name: string        // course name
  tee: string         // free text, e.g. "rot, Damen"
  holes: number       // 9 or 18
  courseRating: number
  slope: number
  par?: number
}

export interface Setting {
  key: string     // e.g. "locale"
  value: any      // e.g. "de" or "en"
}

export class ScoreDiffDB extends Dexie {
  results!: Table<Result, number>
  settings!: Table<Setting, string>
  courseTemplates!: Table<CourseTemplate, number>

  constructor() {
    super('ScoreDiffDB')
    // first schema for version 1
    this.version(1).stores({
      results: '++id, date, courseName, grossScore, scoreDifferential',
    })
    // upgrade-schema for version 2: new table "settings"
    this.version(2).stores({
      settings: '&key'
    })
    // version 3 added importedKeys table (now superseded by importKey on Result)
    this.version(3).stores({
      importedKeys: '&key'
    })
    // version 4: add importKey index to results, drop unused importedKeys table
    this.version(4).stores({
      results: '++id, date, courseName, grossScore, scoreDifferential, importKey',
      importedKeys: null  // drop the table
    })
    // version 5: course templates; results get optional course fields (no index change).
    // Manually entered rounds without a name store "<CR>/<Slope>" in courseName -> migrate.
    this.version(5)
      .stores({
        courseTemplates: '++id, name'
      })
      .upgrade((tx) =>
        tx.table('results').toCollection().modify((r: Result) => {
          if (r.courseRating !== undefined || r.importKey) return
          const legacy = parseLegacyCourseName(r.courseName)
          if (legacy) {
            r.courseRating = legacy.courseRating
            r.slope = legacy.slope
          }
        })
      )
  }
}

export const db = new ScoreDiffDB()
