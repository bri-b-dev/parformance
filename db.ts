import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface Result {
  id?: number
  date: string
  courseName: string
  grossScore: number
  scoreDifferential: number
  storedHandicap: number
  importKey?: string  // "<date>|<courseName-at-import-time>", set on PDF import, not shown in UI
}

export interface Setting {
  key: string     // e.g. "locale"
  value: any      // e.g. "de" or "en"
}

export class ScoreDiffDB extends Dexie {
  results!: Table<Result, number>
  settings!: Table<Setting, string>

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
  }
}

export const db = new ScoreDiffDB()
