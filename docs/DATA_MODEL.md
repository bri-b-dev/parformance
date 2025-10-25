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
    - difficulty? { base: number (1–5), scale: '1-5' }
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

- Drills store (editable legacy list)
  - File: src/stores/drills.ts
  - Purpose: Manage a user-local list of created/edited drills (separate from the static catalog).
  - Persistence: Capacitor Preferences under key `parformance.drills.v1` (historical; other stores use the generic adapter).
  - API examples: `getById(id)`, `getByCategory(cat)`, `add`, `update`, `remove`, `random`.

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
