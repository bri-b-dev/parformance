# Handicap module

Former standalone app **HandyCap** (history of `src/` imported with `git subtree`, source: `bri-b-dev/handycap` @ `9e89619`).
WHS/DGV handicap index from rounds, DGV Scoring Record PDF import, course templates, history chart. Data lives in IndexedDB (Dexie, DB `ScoreDiffDB`).

Integration with the rest of the app:
- Routes: `/handicap/*` (`routes.ts`), rendered inside `HandicapShell.vue`. Everything is lazy, `pdfjs-dist` and Chart.js only load with the history view.
- Styles: `assets/module.css` is scoped under `.hc-root`; no global rules.
- i18n: `vue-i18n` is installed lazily on first visit (`src/main.ts`, `src/i18n.ts`). The language comes from the app setting `language`.
- Strict TypeScript: `npm run typecheck` also checks this folder with `tsconfig.handicap.json`.
- Domain logic (`utils/handicap.ts`, `utils/calculations.ts`) is unchanged; change it only in dedicated PRs with tests.
