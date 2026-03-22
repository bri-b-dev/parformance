export const de = {
  calculatorTitle: 'HandyCap',
  calculatorIntro: 'Mit HandyCap kannst du dein Score Differential für 9 oder 18 Löcher bestimmen und dein Handicap verwalten.\
      Gib dein aktuelles Handicap (HCPI), dein gewertetes Bruttoergebnis (GBE), das Course Rating (CR), den Slope und die Korrektur ein, um dein individuelles Ergebnis zu errechnen.',
  chooseOption: 'Wähle...',
  holes: 'Löcher',
  holesPlayed: 'Gespielte Löcher',
  forExample: 'z.B.',
  reset: 'Zurücksetzen',
  courseRating: 'Course Rating (CR)',
  slope: 'Slope',
  grossScore: 'Gewertetes Bruttoergebnis (GBE)',
  pcc: 'Course Rating Korrektur (PCC)',
  pccNote: 'Anmerkung: Die PCC-Anpassung reicht von -1,0 bis +3,0 (siehe Regel 5.6).',
  scoreDifferential: 'Score-Differential',
  calculate: 'Berechnen',
  note1: 'Dieser Rechner dient als Orientierung und ersetzt nicht die offizielle Handicaps-Berechnung des Verbands.',
  currentRules: 'USGA Handicap-Regeln (PDF) (2024)',
  yourResults: 'Deine Ergebnisse',
  date: 'Datum',
  course: 'Platz',
  saveResult: 'Ergebnis speichern',
  chooseDate: 'Datum wählen',
  currentHandicap: 'Aktuelles Handicap',
  delete: 'Löschen',
  handicapIndexLabel: 'Handicap-Index (HCPI)',
  recalculateHandicap: 'Handicap neu berechnen',
  handicapIndexShort: 'HCPI',
  scoreDifferentialShort: 'SD',
  grossScoreShort: 'GBE',
  development: 'Entwicklung',
  confirm: 'OK',
  cancel: 'Abbrechen',
  confirmDeleteTitle: 'Ergebnis löschen',
  confirmDeleteMessage: 'Bist du sicher, dass du dieses Ergebnis löschen möchtest?',
  inconsistentIndex: 'Speichern des Ergebnisses nicht möglich - der angegebene HCPI weicht von deinem errechneten ab',
  rights: '© 2025, Brigitte Böhm. Alle Rechte vorbehalten.',
  sdVsHcpiTitle: 'Score-Differential vs. Handicap-Index',
  sdVsHcpiText: '<p>Ein <strong>Score Differential</strong> ist ein normierter Wert, der deine tatsächlich gespielte Runde (Brutto-Score) mit dem Schwierigkeitsgrad des Platzes verrechnet. Er zeigt, wie gut du im Verhältnis zu einem „Scratch“-Golfer (Handicap 0) gespielt hast. Niedrigere Differentials bedeuten: bessere Runde.</p>\
<p>Der <strong>Handicap Index</strong> ist dagegen dein langfristiges Spielniveau. Er ergibt sich aus der Auswahl deiner besten Score Differentials:</p>\
<ol>\
  <li>Du berechnest für jede Runde ein Score Differential.</li>\
  <li>Du sammelst deine letzten (bis zu) 20 Differentials.</li>\
  <li>Aus diesen wählst du die besten (niedrigsten) aus, bildest ihren Durchschnitt und wendest den USGA-Korrekturfaktor an – das ergibt deinen Handicap Index.</li>\
</ol>\
<p><em>Kurz:</em> Das Score Differential ist der „Rohwert“ jeder Runde, der Handicap Index das Profil aus deinen besten Runden.</p>\
<p>Gewertete Score Differentials werden wie folgt zur Handicap-Berechnung herangezogen:</p>\
<table>\
  <thead>\
    <tr>\
      <th>Anzahl Ergebnisse</th>\
      <th>Zur Berechnung des Handicap-Index gewertete Score Differentials</th>\
      <th>Anpassung</th>\
    </tr>\
  </thead>\
  <tbody>\
    <tr><td>1</td><td>der niedrigste</td><td>-2.0</td></tr>\
    <tr><td>2</td><td>der niedrigste</td><td>-2.0</td></tr>\
    <tr><td>3</td><td>der niedrigste</td><td>-2.0</td></tr>\
    <tr><td>4</td><td>der niedrigste</td><td>-1.0</td></tr>\
    <tr><td>5</td><td>der niedrigste</td><td>0</td></tr>\
    <tr><td>6</td><td>Durchschnitt der niedrigsten 2</td><td>-1.0</td></tr>\
    <tr><td>7-8</td><td>Durchschnitt der niedrigsten 2</td><td>0</td></tr>\
    <tr><td>9-11</td><td>Durchschnitt der niedrigsten 3</td><td>0</td></tr>\
    <tr><td>12-14</td><td>Durchschnitt der niedrigsten 4</td><td>0</td></tr>\
    <tr><td>15-16</td><td>Durchschnitt der niedrigsten 5</td><td>0</td></tr>\
    <tr><td>17-18</td><td>Durchschnitt der niedrigsten 6</td><td>0</td></tr>\
    <tr><td>19</td><td>Durchschnitt der niedrigsten 7</td><td>0</td></tr>\
    <tr><td>20</td><td>Durchschnitt der niedrigsten 8</td><td>0</td></tr>\
  </tbody>\
</table>',
  courseRatingTitle: 'Was ist das Course Rating?',
  courseRatingText: '<p>Das <strong>Course Rating</strong> (Platzbewertung) ist eine Zahl, die angibt, wie viele Schläge ein „Scratch“-Golfer (Handicap 0) auf einem bestimmten Golfplatz voraussichtlich benötigt. Offizielle Platzbewerter ermitteln diesen Wert, indem sie Layout, Länge, Hindernisse und weitere Platzfaktoren unter normalen Bedingungen berücksichtigen. Ein höheres Course Rating bedeutet: schwerer Platz für einen sehr guten Spieler.</p>\
<p><strong>Wozu dient das Course Rating?</strong></p>\
<ul>\
  <li>Es fließt in die Berechnung des <em>Score Differentials</em> ein, damit dein Brutto-Score (die tatsächlich gespielten Schläge) in Relation zur Platzschwierigkeit gesetzt wird.</li>\
  <li>Gemeinsam mit dem <strong>Slope</strong> sorgt es dafür, dass Runden auf unterschiedlichen Plätzen fair vergleichbar werden.</li>\
</ul>\
<p><strong>Beispiel (grob vereinfacht):</strong></p>\
<ul>\
  <li>Course Rating 72,0 bedeutet: Ein Scratch-Spieler braucht im Durchschnitt 72 Schläge.</li>\
  <li>Du spielst 85 Schläge. Die Differenz (85 – 72,0) = 13 fließt in dein Score Differential ein.</li>\
</ul>\
<p><em>Kurz:</em> Das Course Rating misst, wie schwer ein Platz für einen perfekten Spieler ist, und sorgt dafür, dass dein Score Differential auf jedem Platz fair gewichtet wird.</p>',
  slopeTitle: 'Was ist der Slope-Wert?',
  slopeText: '<p>Der <strong>Slope-Wert</strong> misst, wie viel schwieriger ein Platz für einen „Bogey“-Spieler (etwa Handicap 20–24) im Vergleich zu einem „Scratch“-Spieler (Handicap 0) ist. Er liegt auf einer Skala von 55 (sehr einfach) bis 155 (sehr schwer).</p>\
<p><strong>Wozu dient der Slope?</strong></p>\
<p>Er ergänzt das Course Rating und sorgt dafür, dass Spieler unterschiedlicher Spielstärke fair miteinander verglichen werden. </p>\
<p>Dadurch werden Runden auf einem platztypischen Niveau (abhängig von Schwierigkeit und Handicap-Gruppe) ausgeglichen.</p>\
<p><strong>Beispiel (vereinfacht):</strong></p>\
<ul>\
  <li>Course Rating 72,0, Slope 120.</li>\
  <li>Du spielst 85 Schläge.</li>\
  <li>(85 – 72,0) = 13 Rohdifferenz.</li>\
  <li>Normierung: 13 ÷ (120 / 113) ≈ 12,2 Score Differential.</li>\
</ul>\
<p>Wäre der Slope niedriger (z. B. 105), würde die Division durch einen kleineren Faktor gehen, und dein Differential würde etwas höher ausfallen, weil der Platz als leichter für „durchschnittliche“ Spieler gilt.</p>\
<p><em>Kurz:</em> Der Slope berücksichtigt, wie sich Average-Spieler im Vergleich zu Scratch-Spielern schlagen. Zusammen mit dem Course Rating sorgt er dafür, dass dein Score Differential auf jedem Platz vergleichbar wird.</p>',
  grossScoreTitle: 'Was ist das gewertete Bruttoergebnis?',
  grossScoreText: '<p>Das <strong>gewertete Bruttoergebnis</strong> (GBE) basiert auf dem <em>Netto-Doppelbogey</em> pro Loch. Es begrenzt die anzurechnenden Schläge auf jedem Loch, damit extreme Rundenwerte nicht dein Handicap unverhältnismäßig beeinflussen.</p>\
<p>Für jedes Loch rechnest du:</p>\
<ul>\
  <li><strong>Par des Lochs</strong> (z. B. 4)</li>\
  <li>+ <strong>Handicap-Strokes</strong> für dieses Loch (abhängig von deinem Spieler-Handicap und dem Loch-Handicap)</li>\
  <li>+ 2 Schläge über Par</li>\
</ul>\
<p>Die Formel lautet also:</p>\
<p class=\"formula\"><code>Par + Handicap-Strokes (für dieses Loch) + 2</code></p>\
<p>Dies ist das maximale Netto-Doppelbogey, das pro Loch gezählt wird. Um das gesamte GBE für eine Runde zu erhalten, summierst du diese Werte über alle 18 Löcher:</p>\
<p class=\"formula\"><code>GBE = ∑ (Par<sub>n</sub> + Strokes<sub>n</sub> + 2)  für  n = 1…18</code></p>\
<h4>Beispiel:</h4>\
<ul>\
  <li>Spieler-Handicap 18 → erhält auf den 18 schwierigsten Löchern jeweils 1 Extrastroke.</li>\
  <li><strong>Loch 1:</strong> Par 4, Loch-Handicap 5 → 1 Handicap-Stroke → Netto-Doppelbogey = 4 + 1 + 2 = 7</li>\
  <li><strong>Loch 2:</strong> Par 3, Loch-Handicap 12 → 1 Handicap-Stroke → Netto-Doppelbogey = 3 + 1 + 2 = 6</li>\
  <li>… und so weiter für alle 18 Löcher.</li>\
  <li>Summe aller 18 Netto-Doppelbogey-Werte = dein gewertetes Bruttoergebnis.</li>\
</ul>\
<p>Auf diese Weise wird sichergestellt, dass ein extrem hohes Score an einem einzigen Loch (z. B. eine 10 auf einem Par 4) auf den Wert „Netto-Doppelbogey“ begrenzt bleibt und dein Handicap nicht unverhältnismäßig in die Höhe getrieben wird.</p>',
  pccTitle: 'Was ist die Playing Conditions Calculation?',
  pccText: '<p>Die <strong>Playing Conditions Calculation (PCC)</strong> passt die am Tag erzielten Score Differentials an, wenn die tatsächlichen Spielbedingungen deutlich von den normalen Platzbedingungen abweichen. Zwar liefert das Course Rating eine genaue Platzbewertung unter Standardbedingungen, doch können Tagesfaktoren wie:</p>\
<ul>\
  <li>Wetter (Sturm, starker Regen, extreme Hitze)</li>\
  <li>Abschlagpositionen und Green-Layouts</li>\
  <li>Bodenverhältnisse nach starken Niederschlägen oder Trockenheit</li>\
</ul>\
<p>die Schwierigkeit eines Platzes deutlich verändern. Um dies zu berücksichtigen, wird am Ende eines Tages geprüft, ob die tatsächlichen Rundenergebnisse statistisch signifikant von den zu erwartenden Ergebnissen abweichen.</p>\
<p><strong>So funktioniert die PCC-Berechnung:</strong></p>\
<ol>\
  <li>Sammeln aller Handicap-relevanten Score Differentials des Tages.</li>\
  <li>Vergleich dieser Rundenwerte mit den statistisch erwarteten Differentials laut Course Rating und Slope.</li>\
  <li>Ermittlung eines Anpassungswerts (PCC), der nur dann ungleich null ist, wenn die Durchschnittswerte erheblich von der Norm abweichen.</li>\
  <li>Anpassung jedes einzelnen Score Differentials am Ende des Tages: <br>\
    <code>Adjustiertes Differential = Ursprüngliches Differential – PCC</code>\
  </li>\
</ol>\
<p>Unmittelbar nach jeder Runde kann nur eine vorläufige Handicap-Berechnung erfolgen, da die endgültige PCC erst nach Auswertung aller Ergebnisse des Tages feststeht. In den meisten Fällen ist die PCC jedoch gleich null, weil die Tagesbedingungen kaum von den Standardbedingungen abweichen.</p>',
  capTitle: 'Was sind Low Handicap Index / Cap-Verfahren?',
  capText: '<p>Der <strong>Low Handicap Index</strong> bezeichnet den niedrigsten Handicap-Index, den ein Spieler innerhalb der vergangenen 365 Tage (vor dem aktuellsten Ergebnis) erreicht hat. Er dient als Referenz, um kurzfristige Formtiefs nicht sofort in einem stark ansteigenden Handicap abzubilden.</p>\
<p><strong>Cap-Verfahren:</strong></p>\
<p>Damit dein Handicap-Index nicht bei jedem leichten Leistungsrückgang sofort stark steigt, wird der jährliche Anstieg durch das Cap-Verfahren begrenzt:</p>\
<ul>\
  <li><strong>Low HI ermitteln:</strong> Aus allen Handicap-Indizes der letzten 365 Tage wird der niedrigste Wert ausgewählt (Low Handicap Index).</li>\
  <li><strong>Volle Anstiege bis +3:</strong> Dein Handicap Index darf bis zu drei Schläge über dem Low HI steigen, wenn sich deine Leistungen etwas verschlechtern.</li>\
  <li><strong>Soft Cap (halbierter Anstieg):</strong> Sobald dein Handicap Index mehr als drei Schläge über dem Low HI liegt, werden alle weiteren Anstiege nur noch zur Hälfte gewertet.</li>\
  <li><strong>Hard Cap (+5 Obergrenze):</strong> Der maximale Abstand zwischen aktuellem Handicap Index und Low HI beträgt fünf Schläge. Ist dieser Grenzwert erreicht, kann dein Handicap Index nicht weiter ansteigen, selbst wenn weitere ungünstige Runden folgen.</li>\
</ul>\
<p><strong>Zusammengefasst:</strong></p>\
<ol>\
  <li>Low HI = niedrigster HI der letzten 365 Tage vor dem letzten Resultat.</li>\
  <li>Aktuelles HI darf bis +3 über Low HI steigen.</li>\
  <li>Ab Schlag +4 erfolgen Anstiege nur halb so stark (Soft Cap).</li>\
  <li>Ab Schlag +5 ist kein weiterer HI-Anstieg möglich (Hard Cap).</li>\
</ol>\
<p>Auf diese Weise bleibt dein Handicap Index ein realistischer Indikator deiner besten Spielstärke, und vorübergehende Formtiefs schlagen nicht sofort voll durch.</p>',
  sdCalculationTitle: 'Wie berechnet sich das Score Differential?',
  sdCalculationText: '<h4>1. Score Differential über 18 Löcher</h4>\
<ol>\
  <li>\
    <strong>Gewertetes Bruttoergebnis (GBE) für 18 Löcher ermitteln:</strong>\
    <ul>\
      <li>Für jedes Loch berechnest du den <em>Netto-Doppelbogey</em>:\
        <br><code>Par + Handicap-Strokes (für dieses Loch) + 2</code></li>\
      <li>Wenn du an einem Loch mehr Schläge benötigst als dein Netto-Doppelbogey, wird dein Zähler automatisch auf den Netto-Doppelbogey reduziert.</li>\
      <li>Summiere alle 18 Netto-Doppelbogey-Werte → das ist dein GBE<sub>18</sub>.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Score Differential (SD) berechnen:</strong>\
    <p>Ist dein GBE<sub>18</sub> ermittelt, nutzt du die Formel:</p>\
    <p class=\"formula\"><code>SD<sub>18</sub> = (GBE<sub>18</sub> – CR<sub>18</sub> – PCC<sub>18</sub>) × (113 / Slope)</code></p>\
    <ul>\
      <li><strong>GBE<sub>18</sub>:</strong> Dein gewertetes Bruttoergebnis über 18 Löcher.</li>\
      <li><strong>CR<sub>18</sub>:</strong> Das Course Rating für 18 Löcher (z. B. 72,0).</li>\
      <li><strong>PCC<sub>18</sub>:</strong> Die Playing Conditions Calculation für den gesamten 18-Loch-Tag (meist 0, außer die Tagesbedingungen weichen stark ab).</li>\
      <li><strong>Slope:</strong> Der Slope-Wert des 18-Loch-Platzes.</li>\
    </ul>\
  </li>\
</ol>\
\
<h4>2. Score Differential über 9 Löcher (Referenz: 18-Loch-Berechnung)</h4>\
<p>Wenn nur 9 Löcher gespielt werden, passt du die oben beschriebene 18-Loch-Methode folgendermaßen an:</p>\
<ol>\
  <li>\
    <strong>GBE für die 9 gespielten Löcher:</strong>\
    <ul>\
      <li>Berechne den <em>Netto-Doppelbogey</em> für jedes der 9 gespielten Löcher:\
        <br><code>Par + Handicap-Strokes (für dieses Loch) + 2</code></li>\
      <li>Wenn an einem Loch mehr Schläge nötig sind, wird der Zähler auf den Netto-Doppelbogey reduziert.</li>\
      <li>Summiere alle neun Netto-Doppelbogey-Werte → das ist dein GBE<sub>9</sub>.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Teilergebnis SD<sub>9, gespielt</sub> berechnen:</strong>\
    <p>Analog zur 18-Loch-Formel:</p>\
    <p class=\"formula\"><code>SD<sub>9, gespielt</sub> = (GBE<sub>9</sub> – CR<sub>9</sub> – PCC<sub>9</sub>) × (113 / Slope)</code></p>\
    <ul>\
      <li><strong>GBE<sub>9</sub>:</strong> Gewertetes Bruttoergebnis für die neun gespielten Löcher.</li>\
      <li><strong>CR<sub>9</sub>:</strong> Das Course Rating für die entsprechenden 9 Löcher (z. B. 36,0).</li>\
      <li><strong>PCC<sub>9</sub>:</strong> Playing Conditions Calculation für die 9-Loch-Teilrunde (meist 0).</li>\
      <li><strong>Slope:</strong> Der Slope des gesamten 18-Loch-Platzes (die Normierung auf 113 bleibt bestehen).</li>\
    </ul>\
  </li>\
  <li>\
    <strong>SD<sub>9, berechnet</sub> für die nicht gespielten Löcher:</strong>\
    <p>Du ergänzt dein 9-Loch-Ergebnis durch ein statistisch ermitteltes Differential für die fehlenden 9 Löcher:</p>\
    <p class=\"formula\"><code>SD<sub>9, berechnet</sub> = ((HCPI × 1,04) + 2,4) / 2</code></p>\
    <ul>\
      <li><strong>HCPI:</strong> Dein aktueller Handicap Index.</li>\
      <li>Dieser Wert entspricht dem, was du auf einem neutralen Platz (Par 72, CR 72, Slope 113) in neun Löchern erreichen würdest. In der 9-Loch-SD-Tabelle kannst du ihn direkt unter deinem HCPI-Wert ablesen.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>SD<sub>18</sub> (für Wertung) zusammensetzen:</strong>\
    <p>Nun addierst du beide 9-Loch-Differentials:</p>\
    <p class=\"formula\"><code>SD<sub>18</sub> = SD<sub>9, gespielt</sub> + SD<sub>9, berechnet</sub></code></p>\
    <p>Dieses <em>SD<sub>18</sub></em> wird im Scoring Record verwendet, als wäre es eine volle 18-Loch-Runde. Bei Rundungsdifferenzen hat die Handicap-Server-Formel Vorrang.</p>\
  </li>\
</ol>',
  breakTitle: 'Was ist die „26,5-Bremse“ und wie funktionieren Handicaps zwischen 26,5 und 54?',
  breakText: '<p>Die <strong>„26,5-Bremse“</strong> besagt, dass Spieler mit einem <em>aktuellen Handicap-Index</em> zwischen 26,5 und 54 ihren Index nur <strong>senken</strong> dürfen. Wenn die Leistung einmal nachlässt und der „kalkulierte Handicap-Index“ (ohne Bremse) wieder steigen würde, gilt der höchste bisher erreichte (niedrigste) Handicap-Index in diesem Bereich als „echtes“ Handicap.</p>\
<p><strong>Wie wirkt sich das konkret aus?</strong></p>\
<ul>\
  <li>Ein Spieler hat beispielsweise einen Handicap-Index von <strong>26,5</strong> (bzw. jeden Wert zwischen 26,5 und 54). Sobald er schlechtere Runden spielt und sein berechneter Index > 26,5 wäre, bleibt sein <em>aktuelles Handicap</em> bei 26,5 stehen.</li>\
  <li>Beispiel: Hat ein Spieler vor wenigen Wochen ein <strong>Handicap 26,0</strong> gespielt (sein bisher niedrigster Wert), steigt sein kalkulierter Index nach einer schlechten Runde auf 27,0, wird er aber weiterhin mit 26,0 gewertet.</li>\
  <li>Dieser Mechanismus verhindert, dass ein Spieler schon bei kleinen Formtiefs sofort deutlich mehr Schläge handicappt bekommt. Viele Golfer stagnieren deshalb lange Zeit bei 26,5 oder dem niedrigsten Wert, den sie in diesem Bereich je hatten.</li>\
</ul>\
<p><strong>Zusammengefasst:</strong></p>\
<ol>\
  <li>Für alle Handicap-Indizes zwischen 26,5 und 54 gilt nur eine Verbesserung nach unten.</li>\
  <li>Sobald dein kalkulierter Index in diesem Bereich steigt, bleibst du mit dem niedrigsten, bereits erreichten Wert gewertet.</li>\
  <li>Bei Bedarf kannst du die „26,5-Bremse“ selbstaufheben, um mit dem aktuellen, höheren Index gespielt zu werden.</li>\
</ol>',
  faqTitle: 'Häufige Fragen',
  settingsTitle: 'Einstellungen',
  selectLanguage: 'Sprache auswählen',
  legal: 'Rechtliches',
  impressum: 'Impressum',
  dataProtection: 'Datenschutz',
  navCalculator: "Rechner",
  navHistory: "Historie",
  navSettings: "Einstellungen",
  diffShort: "Diff.",
  hiShort: "HI",

  holesPlayedInfo: "Wähle, ob du 9 oder 18 Löcher gespielt hast. Bei 9 Löchern wird das Resultat entsprechend angepasst.",
  handicapIndexInfo: "Das ist dein letzter gespeicherter Handicap-Index (wird vorausgefüllt).",
  courseRatingInfo: "Bewertung des Platzes (z. B. 72.0).",
  slopeInfo: "Slope-Wert des Platzes (z. B. 113).",
  grossScoreInfo: "Anzahl Schläge für 9 oder 18 Löcher.",
  pccInfo: "PCC = Playing Conditions Calculation, liegt meist zwischen –1.0 und +3.0.",
  projectedHandicap: "Voraussichtlicher Handicap-Index",
  saveModalTitle: "Ergebnis speichern",
  courseNameOptional: "Kursname (optional)",
  errorHolesRequired: "Bitte wähle 9 oder 18 Löcher.",
  errorHandicapInvalid: "Ungültiger Handicap-Index.",
  errorCourseRating: "Bitte gültiges Course Rating eingeben.",
  errorSlope: "Bitte gültigen Slope-Wert eingeben.",
  errorGrossScore: "Bitte gültigen Brutto-Score eingeben.",
  errorPccInvalid: "PCC-Wert zwischen –1.0 und 3.0 erforderlich.",
  errorDateRequired: "Bitte Datum auswählen.",
  yourStats: "Deine Statistiken",
  lastHandicap: "Letzter HI",
  roundCount: "Runden gesamt",
  lowestHI12mo: "Niedrigster HI (12 Monate)",
  avgDiff5: "Ø Diff (letzte 5)",
  handicapChartTitle: "Handicap-Entwicklung",
  downloadRules: "Aktuelle Regeln herunterladen",
  aboutApp: "Über diese App",
  appVersion: "Version: 1.0",
  appAuthor: "Entwickelt von Brigitte Böhm",
  holesPlayedTooltip: "Wähle, ob du 9 oder 18 Löcher gespielt hast. Bei 9 Löchern wird das Handicap entsprechend angepasst.",

  courseRatingShort: 'CR',
  slopeShort: 'Slope',
  detailTitle: "Details zur Runde",
  close: 'Schließen',
  navFaq: 'FAQ',

  // PDF Import
  importPdf: 'Scoring Record importieren',
  importModalTitle: 'Runden aus Scoring Record importieren',
  importPreviewInfo: 'Folgende Runden wurden erkannt. Die SD-Werte stammen direkt aus dem Scoring Record (offizieller Handicap-Server-Wert). Bitte prüfe die Daten vor dem Import.',
  importConfirm: 'Alle importieren',
  importCancel: 'Abbrechen',
  importSuccess: 'Runde(n) erfolgreich importiert.',
  importError: 'Fehler beim Lesen der PDF-Datei.',
  importNothingFound: 'Es wurden keine gültigen Runden in der PDF gefunden.',
  importDuplicateSkipped: 'Runde(n) übersprungen (bereits vorhanden).',
  importColHoles: 'Löcher',
  importColCR: 'CR',
  importColSlope: 'Slope',
  importColGBE: 'GBE',
  importColSD: 'SD (offiziell)',
  importLoading: 'PDF wird verarbeitet…',
  importSelected: '{n} ausgewählt',

};
