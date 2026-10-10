# UI/UX-Specs ParFormance

Stand: 2026-10-10 · Basis: Code-Review von `main` (v1.1.0)
Prio: **P0** = Fundament/Bug, **P1** = hoher Nutzen, **P2** = Ausbau. Aufwand: S (<1 Tag), M (1–3 Tage), L (>3 Tage).

## 0. Ausgangslage (Befunde mit UX-Relevanz)

| # | Befund | Fundstelle |
|---|--------|-----------|
| B1 | Nur 2 Tabs („Drills", „Historie"). „Historie" zeigt aber Statistiken; die Session-Historie steckt nur in der Drill-Detailseite. | `BottomTabs.vue`, `router/index.ts` |
| B2 | Shuffle ist ein Vollbild-Overlay mit 3 Walzen, die alle denselben Drill zeigen, plus Auto-Start nach 500 ms. Keine Möglichkeit, das Ergebnis abzulehnen („nochmal") – nach 500 ms wird sofort navigiert. | `RandomizerView.vue` |
| B3 | Handicap ist optional und ohne Onboarding. Ohne HCP sind alle Level 0, ohne Hinweis. Sessions speichern `hcp: 0`, was sich nicht von Scratch unterscheiden lässt. | `settings.ts`, `DrillDetail.vue` |
| B4 | „Ziel" gibt es nur implizit: `targetLevel = min(3, thresholds.length)`, also immer Level 3. Es gibt kein Ziel-HCP. | `stats/areas.ts` |
| B5 | Umschalter „Aktuell/Historisch" wirkt faktisch nicht: gespeicherte `levelReached` hat Vorrang, auch im Modus „current". | `stats/categoryScores.ts` |
| B6 | Filter (Kategorie, Tag, Suche, Favoriten) belegen 4 Felder + Reset-Button über der Liste; Suche und Favoriten gehen beim Navigieren verloren (nicht in URL/Store). | `DrillList.vue` |
| B7 | Messwert-Eingabe ist erst nach „Session starten" aktiv; Ergebnis nach „Speichern" nur als Toast, kein Level-Feedback. | `DrillDetail.vue` |
| B8 | UI komplett deutsch hartkodiert, `settings.language` ohne Wirkung. Emojis (⚙️ ☀️) als Icons. Viele Inline-Styles. | diverse |
| B9 | Statistik-Listen zeigen rohe Werte („Lücke: 2", „Δ 0.43") ohne Erklärung oder Einheit. | `StatsView.vue` |

## 1. Designprinzipien

1. **Im Training einhändig bedienbar**: Hauptaktionen im Daumenbereich, Touch-Targets ≥ 48 px, große Zahleneingabe.
2. **Eine Frage pro Screen**: Heute → Üben → Fortschritt (aus der README-Schleife *Shuffle → Drill → Session → Result → History → Progress*).
3. **Erklärbare Zahlen**: Jedes Level, jede Lücke und jedes Ziel zeigt, *woher* es kommt (HCP-Bucket, Schwelle, Einheit).
4. **Draußen lesbar**: hoher Kontrast, kein Hover-Zwang, Dark Mode gleichwertig getestet.
5. **Barrierefrei**: `prefers-reduced-motion`, Fokus-Reihenfolge, `aria-live` für Ergebnisse (axe-Skript existiert: `npm run a11y:axe`).

---

## UX-01 · Navigation neu ordnen — P0 · M

> **Umgesetzt**: Tabs Heute · Drills · Zufalls-Drill · Handicap · Fortschritt. Der Verlauf ist ein zweiter Reiter im Fortschritt (`/progress/history`, `src/views/HistoryListView.vue`), damit die Leiste nicht überfüllt wird.

**Problem:** B1. Nutzer finden ihre vergangenen Sessions nicht, „Historie" ist falsch benannt.

**Anforderungen**
- Bottom-Navigation mit 4 Einträgen: **Heute** (Start/Plan), **Drills** (Katalog), **Fortschritt** (Statistik), **Verlauf** (chronologische Session-Liste).
- Der Shuffle-FAB bleibt, wird aber in der Tab-Leiste zentriert (mittiger Aktionsbutton) statt frei schwebend (aktuell `bottom: 92px; right: 20px`, kann Inhalte verdecken).
- Routen: `/today`, `/drills`, `/progress`, `/history`. Alte Route `/history` (Statistik) leitet auf `/progress` um.
- Einstellungen und Theme-Toggle wandern in ein Profil-/Menü-Icon im Header (ein Button statt zwei Emojis).

**Akzeptanzkriterien**
- Jede Session ist in ≤ 2 Taps aus jedem Screen erreichbar.
- Aktiver Tab hat `aria-current="page"`.
- Bestehende Deep-Links `/drill/:id` funktionieren unverändert.

## UX-02 · Onboarding & Handicap-Setup — P0 · S

> **Umgesetzt.** Zwei Schritte (aktuelles HCP, Ziel-HCP mit Datum; die Sprache entfällt, Deutsch reicht), je überspringbar, Schließen/Esc, Fokus bleibt im Dialog. HCP-Eingabe mit Stepper (±0,1), Schieberegler und Textfeld (Komma, `+2,5` = Plus-Handicap, gespeichert als −2,5), weiche Warnung bei Ziel über dem HCP, Schnellauswahl für das Zieldatum. Hinweis ohne HCP ist schließbar („Später"); die Zieltabelle im Drill erklärt, warum keine Zeile markiert ist. „Einführung wiederholen" in den Einstellungen.

**Problem:** B3, B4.

**Anforderungen**
- Beim ersten Start: 3-Schritt-Dialog (Sprache → **aktuelles HCP** → **Ziel-HCP + Zieldatum, optional**), jeweils überspringbar.
- HCP-Eingabe: Stepper/Slider (−54 … +10, Schritt 0,1), Wert wird mit Datum in `hcpHistory` geschrieben.
- Ohne HCP: Banner „Ohne Handicap können wir keine Zielwerte anzeigen" mit CTA, statt stummer Level 0.
- Sessions ohne HCP speichern `hcp: null` (nicht 0).

**Akzeptanzkriterien**
- Nach Onboarding zeigt jede Drill-Detailseite die zum HCP passende Zeile der Zieltabelle hervorgehoben.
- Überspringen führt zu sichtbarem, schließbarem Hinweis, nicht zu leeren Statistiken.

## UX-03 · Tagesansicht „Heute" — P1 · M

> **Umgesetzt** (`/today`, `src/views/TodayView.vue`, Engine in `src/today/suggest.ts`): Serie und Wochen-Sessions, Weiter üben, 3 begründete Vorschläge, Zeitbudget 15/30/60 min. Offen: Wochenziel einstellbar, Fokus-Punkte (UX-05).

**Problem:** Der App-Einstieg ist ein roher Katalog. Die README-Schleife beginnt mit „Shuffle", aber nichts führt dorthin.

**Anforderungen**
- Karte **Weiter üben**: letzter unvollendeter/zuletzt gespielter Drill.
- Karte **Vorschlag**: 1–3 Drills, gewichtet nach Schwäche (Kategorie mit niedrigstem Score, Drills „unter Ziel", lange nicht geübt), mit Begründung („Putting-Score 34 %, zuletzt vor 9 Tagen").
- Karte **Zeitbudget**: Chips 15 / 30 / 60 min → generiert eine Mini-Einheit (siehe UX-05).
- Streak/Wochenziel als kleine Anzeige (Daten existieren in `streaks`/`achievements`).

**Akzeptanzkriterien**
- Bei leerer Historie zeigt „Heute" den Einstieg in Onboarding/Shuffle statt leerer Karten.
- Jeder Vorschlag nennt seinen Grund in einem Satz.

## UX-04 · Shuffle überarbeiten — P1 · M

**Problem:** B2.

**Anforderungen**
- Eine Walze statt drei identischer (Drill-Name), Animation ≤ 1,2 s, mit „Überspringen".
- **Kein Auto-Start und keine Auto-Navigation.** Nach dem Stopp: Ergebniskarte mit Titel, Kategorie, Dauer, Schwierigkeit, Ziel für aktuelles HCP und Buttons **Starten**, **Nochmal**, **Details**.
- Sichtbare Filter im Overlay (Kategorie, Dauer, Ausrüstung/Ort „Putting Green, Range, Bunker …"), Chips statt Checkbox; Favoriten-Bias als Schalter mit Erklärung.
- Sperrliste: Drills der letzten N Sessions werden vermieden (heute nur der letzte Pick, und nur im Speicher).
- Haptik beim Stopp, `prefers-reduced-motion` = sofort Ergebnis.

**Akzeptanzkriterien**
- Nutzer kann ohne Navigation 5× „Nochmal" drücken.
- Escape/Zurück schließt das Overlay und stellt den Fokus auf den auslösenden Button.

## UX-05 · Trainingsplan & Fokus-Punkte — P1 · L

> **Umgesetzt.** Teil A: Sammlungen `/collections`, geführte Einheit `/run`, Zeitbudget- und Ort-Filter in Heute. Teil B: Fokus-Punkte (`FocusCard` auf Heute, Chip im Drill-Detail und im Verlauf, Sessions bekommen den aktiven Fokus automatisch und lassen sich im Verlauf nachträglich zuordnen, Filter im Verlauf, Vorschläge bevorzugen Drills der Fokus-Sammlung). Offen: Ausrüstungs-Filter bei der zufälligen Einheit, Fokus-Auswertung (Fortschritt je Fokus).

**Problem:** „Gruppierungen" und „Fokus-Punkte" existieren nur als Kategorie/Tag-Filter (B6).

**Anforderungen**
- **Sammlungen** (benutzerdefiniert): Name, Drills, Reihenfolge, optionales Icon. Beispiele: „Vor der Runde 20 min", „Wedge-Woche".
- **Fokus-Punkt**: frei wählbares Ziel pro Sammlung/Zeitraum (z. B. „Tempo", „Lag-Putting 10–15 m"), erscheint als Chip auf Heute, Drill-Detail und Verlauf; Sessions können nachträglich dem Fokus zugeordnet werden.
- **Einheit durchlaufen**: Ablauf-Modus mit Fortschrittsbalken „Drill 2 von 4", Weiter/Überspringen, Gesamtzeit.
- **Zufällige Einheit** aus Zeitbudget + Fokus + Ausrüstung (siehe UX-03).

**Akzeptanzkriterien**
- Eine Sammlung lässt sich in ≤ 4 Taps anlegen (Drills per Mehrfachauswahl aus dem Katalog).
- Ablauf-Modus übersteht App-Wechsel/Neustart (Zustand persistiert).

## UX-06 · Drill-Detail & Session-Flow — P0 · M

**Problem:** B7. Lange Scrollseite, Messwert versteckt, kein Abschluss-Moment.

**Anforderungen**
- Oben sticky: Titel, Favorit, **primärer Button „Starten"**.
- Inhalt in Tabs oder Akkordeons: *Aufbau* (Diagramm zuerst), *Ablauf*, *Ziele*, *Verlauf*; „Zu einfach?"-Variante und Zocker-Tipp einklappbar.
- **Live-Modus** beim Start: Vollbild mit großem Timer, große +/−-Zähler (für `count_in_time`, `streak`, `points_total`), Zahlenfeld mit passender Tastatur (`inputmode="numeric"`), Bildschirm bleibt an (Wake Lock/Capacitor KeepAwake).
- **Abschluss-Sheet** nach Speichern: Ergebnis, erreichtes Level (★-Anzeige), Abstand zur nächsten Stufe („noch +2 bis ★★"), Vergleich zu Bestwert und MA(5), PB-Konfetti (reduced-motion-sicher), Notizfeld, Aktionen **Nochmal / Nächster Drill / Fertig**.
- Rückgängig-Toast für 5 s nach dem Speichern.

**Akzeptanzkriterien**
- Messwert lässt sich in ≤ 2 Taps erfassen, wenn der Nutzer direkt nach dem Drill einsteigt (Schnell-Erfassung ohne Timer).
- Ergebnis wird nie ohne sichtbare Bestätigung gespeichert.

## UX-07 · Ziele & Zielbereiche sichtbar machen — P0 · M

**Problem:** B4, B5 – das Kernversprechen „Zielbereiche anhand des (Ziel-)Handicaps" ist in der UI kaum erkennbar.

**Anforderungen**
- Zieltabelle als **Skala** statt Tabelle: Balken von 0 bis Level 3 mit Markern ★1/★2/★3, aktuellem Bestwert und Ziel-HCP-Marker.
- Umschalter **Mein HCP | Ziel-HCP** direkt an der Skala; zeigt, was für das Ziel-HCP nötig ist.
- Level-Badge überall gleich (Farbe **und** Symbol, nicht nur Farbe).
- Auswertungsmodus „Aktuell/Historisch" entweder reparieren (Bug B5 beheben) oder entfernen; Standard „aktuell" mit Info-Tooltip.

**Akzeptanzkriterien**
- Für jeden Drill ist die Schwelle fürs nächste Level in einer Zeile ablesbar.
- Umschalten des Modus verändert die Statistik nachweisbar bei einer Session, die unter anderem HCP gespielt wurde.

## UX-08 · Fortschritt statt Statistik-Dump — P1 · M

**Problem:** B9.

**Anforderungen**
- Kopf: Zeitraum-Segment (7 / 30 / 90 / Alles), Kategorie als Chips.
- Radar bleibt, wird um **Trend-Pfeile je Kategorie** (vs. Vorzeitraum) und eine Tabellenalternative für Screenreader ergänzt.
- Abschnitt „Als Nächstes" ersetzt die drei Listen: je Eintrag ein Satz + Aktion („Lag Putts 15 m: Level 1 von 3 – Drill starten").
- Verlaufsdiagramm je Drill (Messwerte + Schwellenlinien ★1–★3) auf Detailseite; Zoom auf 30/90 Tage.
- Kennzahlen: Sessions/Woche, Trainingsminuten, Anzahl neuer PBs, HCP-Verlauf als Linie.

**Akzeptanzkriterien**
- Keine unbeschrifteten Zahlen („Δ 0.43" → „+0,4 Punkte ggü. vorherigen 5 Sessions").
- Leere Zustände nennen den nächsten sinnvollen Schritt.

## UX-09 · Katalog: Suche & Filter — P1 · S

**Problem:** B6.

**Anforderungen**
- Suchfeld oben fix, Filter in einem **Bottom-Sheet** (Kategorie, Tags, Dauer, Schwierigkeit, Favoriten, „noch nie gespielt", „unter Ziel"); aktive Filter als entfernbare Chips.
- Filterzustand in der URL (`?q=&cat=&tag=&fav=1`) – teilbar, überlebt Zurück-Navigation.
- Suche durchsucht Titel, Tags, Summary; tolerant bei Umlauten.
- Karten: Drill-Diagramm-Thumbnail, Dauer, Schwierigkeit, Level-Badge des Nutzers.
- Virtualisierung nicht nötig (69 Drills), aber Gruppierung nach Kategorie mit sticky Überschriften.

**Akzeptanzkriterien**
- Zurück aus Detail stellt Scrollposition und Filter her.
- „Keine Treffer" bietet „Filter zurücksetzen".

## UX-10 · Visuelles System & Barrierefreiheit — P1 · M

**Problem:** B8; Tailwind, 488 Zeilen `theme.css`, scoped Styles und Inline-Styles nebeneinander.

**Anforderungen**
- Design-Tokens (Farben, Abstände, Radien, Typo) zentral in CSS-Variablen, Tailwind liest sie; Inline-Styles entfernen.
- Eigenes Icon-Set (SVG, z. B. lucide) statt Emojis; kein Info nur über Farbe.
- Fokus-Ringe, Kontrast ≥ 4,5:1 in beiden Themes, Safe-Area-Insets überall.
- Modale Dialoge: Fokusfalle, `Esc`, Rückgabe des Fokus, einheitliche Komponente (aktuell separat in Shuffle, Settings, Confirm).
- `axe`-Check läuft in CI und blockiert bei Verstößen.

**Akzeptanzkriterien**
- Keine `style="…"`-Attribute in Templates für Layout/Farben.
- Alle Screens ohne Maus bedienbar; axe meldet 0 „serious/critical".

## UX-11 · Internationalisierung & Einheiten — P2 · M

**Anforderungen**
- `vue-i18n` mit `de`/`en`; Texte aus Templates und `validation.ts` in Message-Dateien; `settings.language` wirksam.
- Einheiten metrisch/imperial: Distanzen in Drill-Texten werden aus strukturierten Feldern gerendert (heute Freitext im JSON).
- Zahlen/Datum per `Intl`.

**Akzeptanzkriterien**
- Sprachwechsel ohne Neustart; keine hartkodierten UI-Texte außerhalb der Message-Dateien (Lint-Regel).

## UX-12 · Daten sichern & Vertrauen — P1 · S

**Anforderungen**
- Export/Import (JSON) prominent in Einstellungen mit Vorschau („312 Sessions, 14 Monate"), Import mit Zusammenführen/Ersetzen-Auswahl.
- Hinweis bei lokalem Speicher: „Daten liegen nur auf diesem Gerät" + Erinnerung zum Backup nach X Sessions.
- Löschen immer mit `ConfirmModal`, bei „Alles löschen" Eingabe-Bestätigung.

**Akzeptanzkriterien**
- Export → Löschen → Import stellt den identischen Zustand wieder her (Test).

---

## Umsetzungsreihenfolge

1. **Fundament (P0):** UX-07 inkl. Bug B5, UX-02, UX-01, UX-06 (Abschluss-Sheet zuerst).
2. **Kernnutzen (P1):** UX-04, UX-09, UX-08, UX-03, UX-12, UX-10.
3. **Ausbau (P2/L):** UX-05 (Pläne/Fokus), UX-11.

## Offene Entscheidungen

- Sind Sammlungen/Fokus-Punkte rein lokal, oder ist später Sync/Coach-Sharing geplant? (beeinflusst das Datenmodell in UX-05)
- Soll „Ziel-HCP" ein einzelner Wert oder ein Plan mit Zwischenzielen sein?
- Native Wake Lock/KeepAwake: zusätzliches Capacitor-Plugin akzeptabel?
