import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface Result {
  id?: number
  date: string
  courseName: string
  grossScore: number
  scoreDifferential: number
  storedHandicap: number
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
      // "&key" ensures that key is the primary key
      settings: '&key'
    })
  }
}

export const db = new ScoreDiffDB()
