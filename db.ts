import Dexie from 'dexie'
import type { Table } from 'dexie'

// Definiere das Datenbankschema
export interface Result {
    id?: number
    date: string      // ISO-String
    courseName: string
    grossScore: number
    scoreDifferential: number
}

// Erstelle und konfiguriere die IndexedDB
export class ScoreDiffDB extends Dexie {
    // Table-Typisierung
    results!: Table<Result, number>

    constructor() {
        super('ScoreDiffDB')
        this.version(1).stores({
            // ++id = Autoincrement-PrimaryKey
            results: '++id,date,courseName,grossScore,scoreDifferential'
        })
    }
}

// Singleton-Export
export const db = new ScoreDiffDB()
