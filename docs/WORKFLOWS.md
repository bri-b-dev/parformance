# Workflows

This document outlines the key user flows in the app. Each flow is described as succinct bullet steps you can follow to implement or test the UI.

## Drills List (/drills)
- App init
  - Pinia created; router ready
  - Drill catalog store (src/stores/drillCatalog.ts) `load()` is called during app setup/component mount
  - While loading: show spinner/skeleton (see src/components/DrillList.vue)
- On success
  - Render list of drills from `store.drills`
  - Filters
    - Category dropdown
    - Tag chips (multi-select OR semantics)
  - Preserve filters when navigating by passing current `route.query` via `withPreservedQuery()` helper
- Empty state
  - When filtered result is empty, show friendly copy + CTA

## Drill Detail (/drill/:id)
- Deep link via router with `:id`
- Consumer code finds the drill (either from catalog store or local editable store) by `id`
- Render structure using `src/components/DrillDetail.vue`
  - Show duration, timer preset, optional difficulty, instructions and tags
  - Metric block shows `metric.type` and unit label
- Start a session (example UI)
  - Pick the right input component based on metric type via `src/metrics/registry.ts`
  - Optional: start a timer using `Timer.vue` if `duration.timerPreset` is present

## Shuffle overlay (/shuffle)
- Presents a random drill choice respecting optional filters
- If using the legacy editable drills store (src/stores/drills.ts), call `random({ category, maxDifficulty, tagsAny, tagsAll })`
- Else select randomly from the catalog list after applying UI filters

## Start session → Save → See history
- Starting a session
  - User is on a drill detail screen
  - Optional: set HCP and handedness in Settings first (emits `hcp-changed` for HCP-driven highlights)
  - Render metric input UI using `getMetricUIForDrill(drill)` (returns `{ component, label }`)
- Saving a session
  - Build a Session object
    - id: generated (`crypto.randomUUID()` if not provided)
    - drillId: current drill id
    - date: ISO string (e.g., `new Date().toISOString()`)
    - hcp: current settings.hcp or user-entered value
    - result: { value: number, unit: drill.metric.unit }
    - Optional: timerUsed, attempts, levelReached, favorited, notes
  - Call `useSessionsStore().addSession(session)`
    - Store keeps list sorted by date desc and persists debounced
- Viewing history
  - For the current drill, call `listByDrill(drill.id)` to render the chronological list
  - To show a summary, call `latestByDrill(drill.id)`
  - Use `Sparkline.vue` to visualize recent numeric results (e.g., last N `result.value`)

## Stats (high level)
- Data sources
  - Sessions store: all user-recorded results
  - Settings store: HCP context
  - Favorites store: selected drills of interest
- Typical computations
  - Latest value per drill: `latestByDrill(drillId)`
  - Trends over time: map sessions by date and feed into Sparkline, aggregates by week/month
  - Personal bests: max `result.value` per metric type
- UI guidelines
  - Provide filters (date range, category)
  - Provide empty/skeleton states using `src/ui/markup.ts`

## Query preservation pattern
- Use `withPreservedQuery(to, from)` from `src/router/index.ts` when navigating from List → Detail → List to maintain current filters in the URL (supports deep-linking and shareable states).
