import { ref, computed } from 'vue'
import { db, type Result } from '../db'
import { calculateHistory } from '../utils/handicap'

/** Shared across views, so Calculator and History always see the same data. */
const results = ref<Result[]>([])
const countingIds = ref<Set<number>>(new Set())
const recalcNotice = ref(0)

const NOTICE_KEY = 'recalcNotice'

/** Newest first; same-day rounds by id. */
function sortDesc(list: Result[]): Result[] {
  return [...list].sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime()
    return d !== 0 ? d : (b.id ?? 0) - (a.id ?? 0)
  })
}

/**
 * Recomputes all handicap indices from the stored differentials and persists the
 * ones that changed.
 * @returns number of rounds whose stored handicap changed
 */
async function recalc(): Promise<number> {
  const entries = calculateHistory(results.value)
  let changed = 0
  await db.transaction('rw', db.results, async () => {
    for (const e of entries) {
      if (e.id !== undefined && e.storedHandicap !== results.value.find((r) => r.id === e.id)?.storedHandicap) {
        await db.results.update(e.id, { storedHandicap: e.storedHandicap })
        changed++
      }
    }
  })
  results.value = sortDesc(entries.map(({ counting: _c, ...r }) => r as Result))
  countingIds.value = new Set(entries.filter((e) => e.counting && e.id !== undefined).map((e) => e.id!))
  return changed
}

async function load(): Promise<void> {
  results.value = sortDesc(await db.results.toArray())
  const entries = calculateHistory(results.value)
  countingIds.value = new Set(entries.filter((e) => e.counting && e.id !== undefined).map((e) => e.id!))
  const notice = await db.settings.get(NOTICE_KEY)
  recalcNotice.value = typeof notice?.value === 'number' ? notice.value : 0
}

/**
 * Run once at app start: recompute everything and, if stored handicaps changed
 * (e.g. after a calculation fix), remember that to show a notice.
 */
async function startupRecalc(): Promise<void> {
  await load()
  const changed = await recalc()
  if (changed > 0) {
    recalcNotice.value = changed
    await db.settings.put({ key: NOTICE_KEY, value: changed })
  }
}

async function dismissRecalcNotice(): Promise<void> {
  recalcNotice.value = 0
  await db.settings.delete(NOTICE_KEY)
}

async function addMany(entries: Omit<Result, 'id'>[]): Promise<void> {
  if (!entries.length) return
  const ids = await db.results.bulkAdd(entries as Result[], { allKeys: true })
  results.value = sortDesc([...results.value, ...entries.map((e, i) => ({ ...e, id: ids[i] as number }))])
  await recalc()
}

async function add(entry: Omit<Result, 'id'>): Promise<void> {
  await addMany([entry])
}

/** Updates fields that do not affect the handicap (e.g. course data); no recalc. */
async function updateMany(updates: { id: number; changes: Partial<Result> }[]): Promise<void> {
  if (!updates.length) return
  await db.transaction('rw', db.results, async () => {
    for (const u of updates) await db.results.update(u.id, u.changes)
  })
  results.value = results.value.map((r) => {
    const u = updates.find((x) => x.id === r.id)
    return u ? { ...r, ...u.changes } : r
  })
}

async function remove(id: number): Promise<void> {
  await db.results.delete(id)
  results.value = results.value.filter((r) => r.id !== id)
  await recalc()
}

export function useResults() {
  return {
    results,
    countingIds,
    recalcNotice,
    storedHandicap: computed(() => (results.value.length ? results.value[0].storedHandicap : null)),
    load,
    startupRecalc,
    dismissRecalcNotice,
    recalc,
    add,
    addMany,
    updateMany,
    remove,
  }
}
