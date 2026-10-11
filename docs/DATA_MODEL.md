# Data model

This document explains the core data model used in ParFormance: the types, where they live, and how they are persisted and accessed at runtime.

## Types (source of truth)

Location: src/types/index.ts

- MetricType
  - One of: `streak` | `count_in_time` | `points_total` | `stations_cleared` | `corridor_hits` | `score_vs_par`.
- Drill
  - Core content entity that describes a training game.
  - Important fields:
    - id (string), title (string), category (string)
    - equipment { balls?, clubs?, other? }
    - setup { schema, diagram?, location? }
    - duration { suggestedMin?, hardStop?, timerPreset? }
    - difficulty? { base: number (1-5), scale: '1-5' }
    - instructions { training, test?, tooEasy? }
    - metric { type: MetricType, unit: string, hcpTargets: Record<string, number[]> }
    - tags?, zockerTip?, variants?
- Session
  - A recorded training result for a specific drill and date.
  - Fields: id, drillId, date (ISO), hcp, result { value, unit }, optional: timerUsed, attempts, levelReached, favorited, notes.

Notes:
- The JSON catalog (src/data/drills.json) is validated at build time via schemas/drills.schema.json and the Ajv-based script scripts/validate-drills.mjs.

## Stores

- Drill Catalog store (read-only content)
  - File: src/stores/drillCatalog.ts
  - Purpose: Load static content from src/data/drills.json and expose `drills`, `loaded`, and `error`.
  - Error handling: Emits a `toast` CustomEvent on load failure (browser environments) and stores a friendly message.

- Sessions store
  - File: src/stores/sessions.ts
  - Purpose: CRUD for Session items; getters for `listByDrill(drillId)` and `latestByDrill(drillId)` (sorted by date desc).
  - Persistence: via src/utils/persistAdapter.ts, namespace `parformance`, key `sessions`, version `v1`.

- Settings store
  - File: src/stores/settings.ts
  - Purpose: HCP and handedness; emits `hcp-changed` CustomEvent on HCP updates to trigger UI highlights.
  - Persistence: persistAdapter, key `settings`, version `v1`.

- Favorites store
  - File: src/stores/favorites.ts
  - Purpose: Track favorite drill IDs (string[]).
  - Persistence: persistAdapter, key `favorites`, version `v1`.

## Level evaluation (single source of truth)

- `src/hcp/buckets.ts` `resolveThresholds(hcpTargets, hcp)`: bucket containing the hcp (narrowest wins), nearest bucket for gaps or out-of-range.
- `src/hcp/level.ts`: level = number of thresholds met (0-3); `smallerIsBetter` flips the comparison. Missing thresholds never grant a level.
- `src/hcp/evaluator.ts` `evaluateSessionLevel(session, drill, mode)`: `historical` prefers the stored `levelReached` snapshot, `current` re-evaluates with the latest HCP.
- HCP history (`src/stores/hcpHistory.ts`) gets a row whenever the HCP setting changes; evaluation falls back to `settings.hcp` / `session.hcp` if history has no matching row.

## Persistence adapter

- File: src/utils/persistAdapter.ts
- Features:
  - Namespaced, versioned keys: `${namespace}.${key}.v${version}` (e.g., `parformance.sessions.v1`).
  - Debounced writes (`setDebounced`) to reduce write amplification.
  - Migration support on read: automatically migrates from unversioned or older version keys; optional custom migrator.
  - Fallback to in-memory storage when `window.localStorage` is not available (tests/SSR).
- Tested with unit tests and coverage thresholds enforced via Vitest.

## Router & Screens overview

- File: src/router/index.ts
- Routes:
  - `/drills` (List), `/drill/:id` (Detail), `/stats` (Stats), `/shuffle` (Shuffle overlay)
  - Helper `withPreservedQuery(to, from)` keeps filter query params when navigating between screens.

## Rendering & UI

- Minimal presentational components used in Storybook:
  - DrillCard, DrillDetail, Sparkline, Timer in `src/components/`.
- Loading/empty-state patterns available via `src/ui/markup.ts`.

## Backup format

File: `parformance-backup-YYYY-MM-DD.json` (Settings -> Daten & Backup). Code: `src/backup/`.

```jsonc
{
  "app": "parformance",
  "version": 2,                      // format version; files with a higher version are refused
  "exportedAt": "2026-10-11T08:00:00.000Z",
  "appVersion": "2.0.0",
  "data": {
    "settings":        { /* hcp, targetHcp, targetDate, handedness, name, language, units, theme, sounds, shuffleFavorites, notifications */ },
    "favorites":       ["drill-id", ...],
    "sessions":        [ /* Session */ ],
    "hcpHistory":      [ /* { id, hcp, valid_from, valid_to } */ ],
    "collections":     [ /* Collection */ ],
    "focus":           [ /* Focus */ ],
    "achievements":    [ /* AchievementSnapshot */ ],
    "rounds":          [ /* rounds of the handicap area (IndexedDB), without database ids */ ],
    "courseTemplates": [ /* course templates (IndexedDB) */ ]
  }
}
```

- Version 1 (flat, without `app`/`data`, no rounds or templates) is still read; it is marked as an older backup.
- Not part of a backup: device bookkeeping (`lastBackupAt`, `lastBackupCount`, `backupSnoozedUntil`), onboarding flags, a running guided session.
- Reading cleans every section with the same sanitizers as the stores; unusable entries are skipped and reported as warnings.
- **Zusammenführen** keeps the device data and adds what is new (sessions/collections/focus/achievements by id, rounds by day + course + score, course templates by value, favorites by drill; device settings win, gaps are filled). It is repeatable: importing the same file twice adds nothing.
- **Ersetzen** overwrites everything (after confirmation, optionally with a safety backup first). Stored handicaps of imported rounds are recalculated.
- **Alles löschen** needs the typed word `LÖSCHEN` and offers a backup first.
- The backup reminder (`backupReminder`) asks after the first 5 entries, after 10 new sessions/rounds, or after 30 days with changes; "Später" snoozes for 7 days.
