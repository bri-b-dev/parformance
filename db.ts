// src/db.ts
import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface Result {
  id?: number
  date: string
  courseName: string
  grossScore: number
  scoreDifferential: number
}

export interface Setting {
  key: string     // z. B. "locale"
  value: any      // z. B. "de" oder "en"
}

export class ScoreDiffDB extends Dexie {
  results!: Table<Result, number>
  settings!: Table<Setting, string>

  constructor() {
    super('ScoreDiffDB')
    // Erstes Schema für Version 1
    this.version(1).stores({
      results: '++id, date, courseName, grossScore, scoreDifferential',
    })
    // Upgrade-Schema für Version 2: neue Tabelle "settings"
    this.version(2).stores({
      // "&key" sorgt dafür, dass key der Primärschlüssel ist
      settings: '&key'
    })
  }
}

export const db = new ScoreDiffDB()
