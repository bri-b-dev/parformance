# Spec: HandyCap in ParFormance integrieren

Stand: 2026-10-10 · Status: **Entwurf, noch nicht umgesetzt**
Verwandt: [UX-SPECS.md](./UX-SPECS.md) (UX-01 Navigation, UX-02 Onboarding), [../DATA_MODEL.md](../DATA_MODEL.md)

## 1. Entscheidung

HandyCap (`../handycap`, v1.3.x) wird als **Modul** in ParFormance übernommen. ParFormance bleibt die einzige App (Name, App-ID `com.bribdev.parformance`, Store-Eintrag). HandyCap wird danach archiviert.

**Warum**
- Die echte HCP-Zeitreihe liegt in HandyCap: jede Runde hat `date`, `scoreDifferential` und `storedHandicap`, der HCPI wird nach WHS/DGV berechnet (`utils/handicap.ts`, mit Tests). Die in ParFormance bisher gepflegte `hcpHistory` (ein Eintrag je manueller HCP-Änderung) wäre eine zweite, schwächere Quelle für dieselbe Information.
- Das HCP muss nicht mehr von Hand gepflegt werden. Ziel-HCP und Zieldatum bekommen echten Inhalt („noch X Runden bis HCP 12").
- Rundendaten schließen den Kreislauf *Runde → Schwächen → passende Drills → Fortschritt*.

**Rahmenbedingungen (vom Eigentümer bestätigt)**
- HandyCap hat nur eine Nutzerin/einen Nutzer: keine Store-Migration und keine Abwärtskompatibilität nötig.
- Die Migration der Bestandsdaten läuft über den vorhandenen **PDF-Import** (DGV Scoring Record, Detailliert).
- Das **Logo von HandyCap** soll das neue App-Logo werden (siehe 6).

## 2. Ist-Zustand (geprüft)

| | ParFormance | HandyCap |
|---|---|---|
| Stack | Vue 3, Vite 6, Pinia, Tailwind, Capacitor 7 | Vue 3, Vite 6, Capacitor 7, vue-router |
| Sprache | TS gemischt (`strict: false`), UI hartkodiert Deutsch | TS strikt, vue-i18n (de/en) |
| Daten | localStorage über `persistAdapter` | Dexie/IndexedDB (`ScoreDiffDB`, Schema v5) |
| Tests | Vitest 3, 33 Tests | Vitest 5, Tests für Berechnung, DB, Vorlagen, Legacy-Parsing |
| Besonderes | 69 Drills, Level je HCP-Bereich | PDF-Import (`pdfjs-dist`), Chart.js, Kursvorlagen |
| App-ID | `com.bribdev.parformance` | `com.bribdev.handycap` |

**Nicht geprüft** (vor Umsetzung klären): ob der PDF-Import mit den aktuellen DGV-PDFs vollständig läuft, wie zuverlässig `storedHandicap` bei alten/manuell erfassten Runden ist, und ob `vue-i18n@12.0.0-alpha` stabil genug für den Einsatz in der größeren App ist.

## 3. Zielarchitektur

Modularer Monolith: HandyCap bleibt ein abgeschlossenes Modul, ParFormance greift nur über eine schmale Schnittstelle zu.

```
src/
  modules/
    handicap/              # aus ../handycap übernommen, Verhalten unverändert
      db.ts                # Dexie, eigene Datenbank
      utils/               # handicap.ts, calculations.ts, pdfParser.ts, ...
      composables/         # useResults, useCourseTemplates, useCalculatorDraft
      views/               # Rechner, Verlauf, Vorlagen
      locales/             # de.ts, en.ts
  hcp/
    source.ts              # HcpSource-Schnittstelle (neu)
    sources/manual.ts      # bisherige Einstellung + hcpHistory
    sources/rounds.ts      # Adapter auf modules/handicap
```

### 3.1 Schnittstelle `HcpSource`

```ts
interface HcpSource {
  /** HCP, das an diesem Datum galt (null = unbekannt). */
  getHcpAt(dateIso: string): Promise<number | null> | number | null
  getLatest(): Promise<number | null> | number | null
  /** Optional: Zeitreihe für Diagramme. */
  getSeries?(): Promise<{ date: string; hcp: number }[]>
}
```

- Der Auswerter (`hcp/evaluator.ts`) und die Statistik (`stats/areas.ts`) kennen nur noch `HcpSource`.
- Rangfolge: **Runden vorhanden → `rounds`**, sonst **`manual`**. Das manuelle Feld in den Einstellungen bleibt für Nutzer ohne Runden und wird bei vorhandenen Runden ausgegraut („aus deinen Runden berechnet").
- `hcpHistory` bleibt als Fallback der manuellen Quelle bestehen.
- Ob `getHcpAt` synchron oder asynchron ist, hängt an Dexie (async). Die Statistik muss dafür vorab eine Zeitreihe laden und synchron auswerten (kein `await` in Computeds).

### 3.2 Persistenz

- Phase 1: zwei Speicher nebeneinander (localStorage für Training, Dexie für Runden). Kein Umbau.
- Spätere Option (eigene Spec): Training ebenfalls nach Dexie, mit einmaliger Migration der `parformance.*`-Keys.
- Backup/Export muss **beide** Speicher enthalten (heute fehlt `hcpHistory` im Export, siehe offene Punkte).

## 4. Umsetzung in Phasen

Jede Phase ist ein eigener PR, die App bleibt in jeder Phase lauffähig.

### Phase A – Schnittstelle (unabhängig von der Fusion)
1. `HcpSource` + `manual`-Quelle; `evaluator`, `areas`, `StatsView` darauf umstellen.
2. HCP-Historie in Export/Import aufnehmen.

**Akzeptanz:** Verhalten unverändert, bestehende Tests grün, neue Tests für die Quellen-Rangfolge.

### Phase B – Modul übernehmen
1. Code per `git subtree` oder `git filter-repo` mit Historie nach `src/modules/handicap/` holen.
2. Abhängigkeiten ergänzen (`dexie`, `chart.js`, `chartjs-adapter-date-fns`, `pdfjs-dist`, `vue-i18n`), Versionen von Vitest und TypeScript angleichen.
3. `tsconfig`: Modul strikt, Rest wie bisher (Projekt-Referenzen oder `include`-Overrides), `npm run typecheck` deckt beides ab.
4. Routen `/handicap/*` **lazy-geladen**; `pdfjs-dist` und Chart.js nur im Handicap-Chunk.
5. Dexie-Datenbankname bleibt `ScoreDiffDB` (neue Herkunft, keine Kollision).

**Akzeptanz:** Alle HandyCap-Tests laufen im Repo grün; Startbundle wächst um höchstens ~10 % (messen und festhalten); `/handicap` funktioniert wie in der alten App.

### Phase C – Verdrahtung
1. `rounds`-Quelle: `getHcpAt` über die Runden (letzter `storedHandicap` mit `date <= dateIso`), `getLatest`, `getSeries`.
2. Einstellungen: HCP-Feld ausgrauen, wenn Runden existieren; Onboarding fragt das HCP nur ohne Runden ab.
3. Zielkarte (Statistik): „Ziel-HCP 12 – aktuell 18,4" mit Verlaufsdiagramm aus `getSeries`.

**Akzeptanz:** Eine neue Runde ändert das HCP in Drill-Zieltabelle („Du") und Statistik ohne manuelle Eingabe; eine Session von letztem Monat wird im Modus „Historisch" mit dem damaligen HCP bewertet.

### Phase D – Navigation und Branding
1. Navigation nach UX-01: **Heute · Drills · Handicap · Fortschritt**, Verlauf folgt.
2. Logo und Icons (siehe 6), Splash, Android-Ressourcen.
3. i18n: Training-Texte in `vue-i18n` überführen (Voraussetzung für UX-11).

### Phase E – Aufräumen
1. HandyCap-Repo archivieren, README-Hinweis auf ParFormance.
2. `CONTRIBUTING.md`, `DATA_MODEL.md` und `AGENTS.md` (aus HandyCap) zusammenführen.

## 5. Migration der Bestandsdaten

Es gibt einen Nutzer, daher genügt der vorhandene Weg:

1. Alle DGV-Scoring-Record-PDFs in der neuen App importieren (`/handicap` → Import).
2. Der Import ist idempotent (`importKey = "<date>|<courseName>"`) und **reichert** vorhandene Runden an (CR, Slope, Tee, Par), statt Duplikate zu erzeugen (siehe `PLAN.md` in HandyCap).
3. Manuell erfasste Runden ohne PDF: aus der alten App notieren oder einmalig per Dexie-Export (`db.results.toArray()` in der Browser-Konsole der alten App) in eine JSON-Datei sichern. Ein Import dafür ist **optional**, nur falls es solche Runden gibt.
4. Danach prüfen: letztes HCP, Rundenzahl und die Spalte „zählt" müssen mit der alten App übereinstimmen (Abnahme-Checkliste).

## 6. Branding (Logo von HandyCap)

**Ausgangslage:** `src/assets/logo.png` ist ein 1024×1024-Raster (1,3 MB) mit dunklem Glow-Hintergrund. Motiv: abgerundetes Hochformat-Rechteck (Smartphone/Scorekarte) mit Kappe und Tee, darunter der Schriftzug „HandyCap". ParFormance verwendet SVGs (`public/icon.svg`, `icon-wordmark.svg`, `splash-animated.svg`).

**Anforderungen**
- Das Motiv (Rahmen, Kappe, Tee) wird als **SVG auf transparentem Hintergrund** neu gezeichnet bzw. nachgezeichnet; das PNG mit Glow ist nicht für App-Icons geeignet.
- Schriftzug **„ParFormance"** (statt „HandyCap"). Den Claim „Train smarter - play better" aus dem bisherigen Wortmarken-SVG beibehalten.
- Varianten: App-Icon (Vollfläche und Adaptive-Icon-Vordergrund, 1024²), Header-Logo, Wortmarke hell/dunkel, Splash. Aus `resources/icon.svg` und `resources/splash.svg` mit `@capacitor/assets` erzeugen.
- Farben: das Grün des Logos wird zum Primärton in `theme.css` (bisher `#2F7A52`); Kontrast ≥ 4,5:1 in beiden Themes prüfen (siehe UX-10).
- PNG nicht ins Repo übernehmen (Größe); falls als Vorlage nötig, nur als Quelle ablegen.

**Akzeptanz:** Icon wirkt auf hellem und dunklem Launcher sauber (kein Glow-Rand), Splash und Header zeigen das neue Logo, `public/manifest.webmanifest` und Android-Ressourcen sind aktualisiert.

## 7. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Bundle wird deutlich größer (`pdfjs-dist`, Chart.js) | Lazy-Routen, eigener Chunk, Größe in CI ausgeben |
| `vue-i18n@12 alpha` instabil | auf stabile Version prüfen/wechseln, bevor das Modul übernommen wird |
| HCPI-Logik wird versehentlich verändert | Modul unverändert übernehmen, Tests laufen in CI, Änderungen nur in eigenen PRs |
| Zwei Speicher (localStorage + Dexie) fallen im Backup auseinander | gemeinsamer Export/Import mit Versionsfeld, Test: Export → Löschen → Import |
| Async-HCP in synchronen Computeds | Zeitreihe vorab laden, in einem Store halten |

## 8. Offene Entscheidungen

1. Soll das HCP bei vorhandenen Runden **nur** aus den Runden kommen, oder darf man es manuell überschreiben (z. B. wenn der Verein ein anderes HCP führt)?
2. Soll die Rundenerfassung auch **Schlag-/Stats-Daten** (FIR, GIR, Putts) aufnehmen, damit Drills gezielt vorgeschlagen werden können? (Eigene Spec, baut auf Phase C auf.)
3. Wird die Sprache **de/en** für die ganze App Pflicht (Phase D) oder bleibt das Training zunächst deutsch?
4. Version der zusammengeführten App: Fortsetzung der ParFormance-Version (1.x) oder 2.0?
