# Migration der HCP-Zielwerte

Erzeugt mit `scripts/migrate-hcp-targets.mjs`. Einzelwerte gelten als **Ziel (Level 2)** des HCP-Bereichs; Level 1 und 3 sind
Vorschläge (größer ist besser: ±25 %, kleiner ist besser: ±10 %, jeweils mindestens ±1). **Bitte fachlich prüfen und anpassen.**

## Richtung korrigiert (`smallerIsBetter`) (5)

- `shortgame_towel_target` (Minuten bis 8 Treffer) → `smallerIsBetter: true`
- `bunker_sandy_par` (Gesamtschläge (5 Bunkerschläge + Putts)) → `smallerIsBetter: true`
- `course_spot_on_targets` (Schläge über Par) → `smallerIsBetter: true`
- `course_scoring_clubs` (Gesamtschläge (7 Löcher)) → `smallerIsBetter: true`
- `course_worst_ball` (Gesamtschläge (Worst Ball)) → `smallerIsBetter: true`

## Migrierte Einzelwerte (24)

- `putting_circle` (größer ist besser)
  - 54-27: 6 → [4, 6, 8]
  - 26-12: 8 → [6, 8, 10]
  - 11-0: 10 → [7, 10, 13]
- `putting_shootout` (größer ist besser)
  - 54-27: 4 → [3, 4, 5]
  - 26-12: 8 → [6, 8, 10]
  - 11-0: 14 → [10, 14, 18]
- `putting_around_the_world` (größer ist besser)
  - 54-27: 5 → [4, 5, 6]
  - 26-12: 7 → [5, 7, 9]
  - 11-0: 8 → [6, 8, 10]
- `putting_pace_putting` (größer ist besser)
  - 54-27: 8 → [6, 8, 10]
  - 26-12: 12 → [9, 12, 15]
  - 11-0: 21 → [16, 21, 26]
- `putting_five_balls` (größer ist besser)
  - 54-27: 1 → [1, 2, 3]
  - 26-12: 2 → [1, 2, 3]
  - 11-0: 3 → [2, 3, 4]
- `putting_draw_back` (kleiner ist besser)
  - 54-27: 27 → [30, 27, 24]
  - 26-12: 24 → [26, 24, 22]
  - 11-0: 20 → [22, 20, 18]
- `shortgame_up_and_down` (kleiner ist besser)
  - 54-27: 15 → [17, 15, 13]
  - 26-12: 12 → [13, 12, 11]
  - 11-0: 10 → [11, 10, 9]
- `shortgame_beat_21` (kleiner ist besser)
  - 54-36: 33 → [36, 33, 30]
  - 35-27: 30 → [33, 30, 27]
  - 26-19: 28 → [31, 28, 25]
  - 18-12: 26 → [29, 26, 23]
  - 11-5: 24 → [26, 24, 22]
  - 4-0: 21 → [23, 21, 19]
- `shortgame_hit_the_spot` (größer ist besser)
  - 54-36: 2 → [1, 2, 3]
  - 35-27: 4 → [3, 4, 5]
  - 26-19: 6 → [4, 6, 8]
  - 18-12: 9 → [7, 9, 11]
  - 11-5: 12 → [9, 12, 15]
  - 4-0: 15 → [11, 15, 19]
- `bunker_hit_it_close` (größer ist besser)
  - 54-36: 3 → [2, 3, 4]
  - 35-27: 4 → [3, 4, 5]
  - 26-19: 5 → [4, 5, 6]
  - 18-12: 7 → [5, 7, 9]
  - 11-5: 9 → [7, 9, 11]
  - 4-0: 12 → [9, 12, 15]
- `bunker_sandy_par` (kleiner ist besser)
  - 54-36: 20 → [22, 20, 18]
  - 35-27: 17 → [19, 17, 15]
  - 26-19: 15 → [17, 15, 13]
  - 18-12: 13 → [14, 13, 12]
  - 11-5: 12 → [13, 12, 11]
  - 4-0: 10 → [11, 10, 9]
- `pitching_four_stations` (größer ist besser)
  - 54-36: 6 → [4, 6, 8]
  - 35-27: 10 → [7, 10, 13]
  - 26-19: 14 → [10, 14, 18]
  - 18-12: 16 → [12, 16, 20]
  - 11-5: 21 → [16, 21, 26]
  - 4-0: 24 → [18, 24, 30]
- `driving_nine_drives` (größer ist besser)
  - 54-36: 3 → [2, 3, 4]
  - 35-27: 4 → [3, 4, 5]
  - 26-19: 5 → [4, 5, 6]
  - 18-12: 6 → [4, 6, 8]
  - 11-5: 7 → [5, 7, 9]
  - 4-0: 8 → [6, 8, 10]
- `driving_hit_three_greens` (größer ist besser)
  - 54-27: 9 → [7, 9, 11]
  - 26-12: 14 → [10, 14, 18]
  - 11-0: 20 → [15, 20, 25]
- `driving_14_fairways` (größer ist besser)
  - 54-27: 4 → [3, 4, 5]
  - 26-12: 7 → [5, 7, 9]
  - 11-0: 11 → [8, 11, 14]
- `driving_short_aims` (größer ist besser)
  - 54-27: 2 → [1, 2, 3]
  - 26-12: 3 → [2, 3, 4]
  - 11-0: 4 → [3, 4, 5]
- `driving_fade_and_draw` (größer ist besser)
  - 36-27: 2 → [1, 2, 3]
  - 26-12: 4 → [3, 4, 5]
  - 11-0: 7 → [5, 7, 9]
- `course_iron_play` (kleiner ist besser)
  - 54-36: "+10" → [11, 10, 9]
  - 35-19: "+6" → [7, 6, 5]
  - 18-12: "+3" → [4, 3, 2]
  - 11-0: "+2" → [3, 2, 1]
- `course_on_track` (kleiner ist besser)
  - 36-27: 58 → [64, 58, 52]
  - 26-19: 53 → [58, 53, 48]
  - 18-12: 49 → [54, 49, 44]
  - 11-5: 46 → [51, 46, 41]
  - 4-0: 40 → [44, 40, 36]
- `shortgame_worstball_chipping` (kleiner ist besser)
  - 54-36: 33 → [36, 33, 30]
  - 35-27: 30 → [33, 30, 27]
  - 26-19: 27 → [30, 27, 24]
  - 18-12: 25 → [28, 25, 22]
  - 11-5: 22 → [24, 22, 20]
  - 4-0: 19 → [21, 19, 17]
- `shortgame_up_and_down_series` (größer ist besser)
  - 54-36: 2 → [1, 2, 3]
  - 35-27: 3 → [2, 3, 4]
  - 26-19: 4 → [3, 4, 5]
  - 18-12: 5 → [4, 5, 6]
  - 11-5: 7 → [5, 7, 9]
  - 4-0: 9 → [7, 9, 11]
- `course_spot_on_targets` (kleiner ist besser)
  - 18-12: "+5" → [6, 5, 4]
  - 11-5: "+3" → [4, 3, 2]
  - 4-0: "+2" → [3, 2, 1]
- `course_scoring_clubs` (kleiner ist besser)
  - 18-12: 48 → [53, 48, 43]
  - 11-5: 43 → [47, 43, 39]
  - 4-0: 38 → [42, 38, 34]
- `course_worst_ball` (kleiner ist besser)
  - 11-5: "+9" → [10, 9, 8]
  - 4-0: "+5" → [6, 5, 4]

## Manuell: nicht numerische Ziele (10)

- `pitching_attack_the_flag` 54-27: {"radius":"≤ 8 m"}
- `pitching_attack_the_flag` 26-19: {"radius":"≤ 7 m"}
- `pitching_attack_the_flag` 18-12: {"radius":"≤ 5 m"}
- `pitching_attack_the_flag` 11-5: {"radius":"≤ 3 m"}
- `pitching_attack_the_flag` 4-0: {"radius":"≤ 2 m"}
- `pitching_mixed_clubs` 54-27: {"radius":"≤ 8 m"}
- `pitching_mixed_clubs` 26-19: {"radius":"≤ 6 m"}
- `pitching_mixed_clubs` 18-12: {"radius":"≤ 4 m"}
- `pitching_mixed_clubs` 11-5: {"radius":"≤ 3 m"}
- `pitching_mixed_clubs` 4-0: {"radius":"≤ 1.5 m"}

## Arrays mit nur einem Wert (6) – migriert

- `shortgame_towel_target` (kleiner ist besser, Wert = Ziel/Level 2)
  - 54-37: [15] → [17, 15, 13]
  - 36-27: [13] → [14, 13, 12]
  - 26-19: [12] → [13, 12, 11]
  - 18-12: [10] → [11, 10, 9]
  - 11-5: [8] → [9, 8, 7]
  - 4-0: [6] → [7, 6, 5]

## Von Hand geklärt

- `putting_hit_the_hall`: Reihenfolge der Ziele war vertauscht. Jetzt 54-27: 15, 26-12: 18, 11-0: 24 als Ziel (Level 2) → `[11, 15, 19]`, `[13, 18, 23]`, `[18, 24, 30]`.
- `putting_under_pressure`: Die alten Tripel (z. B. `[3, 1, 1]`) waren Serien je Position (90 / 180 / 270 cm), keine Level. Gemessen wird jetzt die geschaffte Serie an Position 1; deren bisheriger Zielwert (3 / 5 / 10) ist Level 2 → `[2, 3, 4]`, `[4, 5, 6]`, `[7, 10, 13]`. Die Zielwerte für Position 2 und 3 (1/1, 3/1, 4/2) sind nicht mehr hinterlegt; Einheit entsprechend angepasst.

## Drills ohne Zielwerte (17) – ergänzt

Alle Werte gelten für jedes HCP (Bereich \`54-0\`), weil es keine HCP-abhängigen Vorgaben gibt.

- **Punkteskala aus dem Drill-Text abgeleitet:** \`tempo_improve_your_feeling\` (0–15 Punkte) → \`[6, 9, 13]\`, \`shapen_shape_it\` (0–12 Treffer) → \`[3, 6, 9]\`.
- **Schulnote 1–6 (1 = sehr gut), kleiner ist besser:** \`sweetspot_hit_the_sweetspot_2\`, \`sweetspot_out_of_the_sweetspot\` → \`[4, 3, 2]\`.
- **Selbsteinschätzung 1–5 (5 = sehr gut), neuer Metrik-Typ \`rating\`:** \`sweetspot_hit_the_sweetspot_1\`, \`tempo_stay_in_the_rhythm\`, \`tempo_find_your_tempo\`, \`tempo_swing_like_a_pro\`, \`shapen_safety_shot\`, \`simulation_imagination_on\`, \`simulation_first_tee_shot\`, \`platz_long_vs_easy\`, \`platz_stats\`, \`platz_get_your_points\`, \`platz_no_tees\`, \`platz_make_it_rough\`, \`platz_play_unusual_shots\` → \`[3, 4, 5]\`.
  Die bisherigen Felder (\`fields\`, \`evaluation\`, \`stages\`) bleiben als Hinweis am Drill, werden aber noch nicht einzeln erfasst (Folge-Thema: strukturierte Erfassung von FIR/GIR/Score usw.).
