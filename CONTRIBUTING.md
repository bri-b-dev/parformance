# Contributing to ParFormance

Thanks for your interest in contributing! This guide explains how to set up your environment, coding standards, how to run tests, and how to contribute new drills and features.

## Getting started
- Requirements
  - Node.js: >= 20.19 or >= 22.12
  - npm
- Setup
  - Fork and clone the repo
  - Install dependencies: `npm ci`
  - Start dev server: `npm run dev`

## Branches and PRs
- Create a feature branch from `main`: `git checkout -b feat/your-topic`
- Keep PRs focused and small where possible
- Reference related issues in your PR description
- Ensure CI is green (tests, coverage, schema validation, Storybook build)

## Scripts and quality gates
- Unit tests: `npm run test`
- Coverage threshold (enforced): `npm run test:coverage`
- Drills JSON validation: `npm run validate:drills`
- Accessibility smoke check (axe + jsdom): `npm run a11y:axe`
- Storybook: `npm run storybook`, build `npm run build-storybook`

## Code style
- The project uses modern ESM and Vite; there is no strict linter configured yet
- Prefer TypeScript for new modules
- Keep changes minimal and focused; include unit tests when adding logic

## Project architecture
- See `docs/DATA_MODEL.md` for entities, stores, and persistence
- See `docs/WORKFLOWS.md` for key user flows and where the logic lives

## How to add a drill (content contribution)
You can add one or more drills to the static catalog, which is validated at build time.

1. Open the drills catalog
   - File: `src/data/drills.json`
   - This is an array of Drill objects (see `schemas/drills.schema.json` and `src/types/index.ts`)
2. Add your drill object
   - Ensure the object follows the schema with required fields:
     - `id` (string, unique), `title`, `category`
     - `equipment`, `setup`, `duration`, `instructions`, `metric`
   - Example structure:
```json
{
  "id": "your_unique_id",
  "title": "Title",
  "category": "Chipping Green",
  "equipment": { "balls": 6, "clubs": ["Wedge"] },
  "setup": { "schema": "Describe the setup", "location": "Chipping Green" },
  "duration": { "suggestedMin": 5, "timerPreset": 300 },
  "instructions": { "training": "What to do", "test": "Optional test", "tooEasy": "Optional harder variant" },
  "metric": {
    "type": "streak",
    "unit": "Zonen in Serie",
    "hcpTargets": { "54-27": [2,3,4], "26-12": [5,7,9], "11-0": [11,13,15] }
  },
  "tags": ["Längenkontrolle", "Kontakt"]
}
```
3. Validate locally
   - Run: `npm run validate:drills`
   - The build will fail (exit code ≠ 0) if the JSON is invalid; fix errors shown by Ajv
4. Preview in the app
   - `npm run dev` and open the list view (the catalog is loaded by `src/stores/drillCatalog.ts`)
5. Commit and open PR
   - Commit your change with a clear message, e.g., `docs(drills): add chip_carry_zone`
   - Open a PR against `main`

Notes:
- The schema lives in `schemas/drills.schema.json` (Draft 2020-12)
- Keep IDs stable and human-readable (kebab_case or snake_case), e.g., `chip_carry_zone`

## Adding or changing logic
- When touching stores or utils, add or update unit tests under `tests/`
- Ensure coverage thresholds remain satisfied (`npm run test:coverage`)
- For UI components, consider adding/adjusting Storybook stories in `src/components/*.stories.ts`

## Release & CI
- CI runs on push/PR: drills validation, unit tests with coverage, axe check, and Storybook build
- PRs should only be merged when all checks pass
