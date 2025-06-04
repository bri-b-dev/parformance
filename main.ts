import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import router from './router'

import '@/assets/global.css'

// 1) Definiere deine Übersetzungs-Objekte
const messages = {
  en: {
    calculatorTitle: 'HandyCap',
    calculatorIntro: 'With HandyCap you can determine your score differential for 9 or 18 holes and manage your handicap. \
        Enter your current handicap (HCPI), adjusted gross score (AGS), the course rating (CR), the slope and the Playing Conditions Calculation (PCC) to calculate your individual score.',
    chooseOption: 'Choose...',
    holes: 'holes',
    holesPlayed: 'Holes played',
    forExample: 'e.g.',
    reset: 'Reset',
    courseRating: 'Course Rating (CR)',
    slope: 'Slope',
    grossScore: 'Adjusted Gross Score (AGS)',
    pcc: 'Playing Conditions Calculation (PCC)',
    pccNote: 'Note: The PCC adjustment ranges from -1.0 to +3.0 (see Rule 5.6).',
    scoreDifferential: 'Score Differential',
    calculate: 'Calculate',
    note1: 'This calculator serves as a guide and does not replace the official handicap calculation of the association.',
    currentRules: 'USGA Handicap-Rules (PDF) (2024)',
    yourResults: 'Your results',
    date: 'date',
    course: 'course',
    saveResult: 'save result',
    chooseDate: 'choose date',
    currentHandicap: 'Current Handicap',
    delete: 'delete',
    handicapIndexLabel: 'Handicap-Index (HCPI)',
    recalculateHandicap: 'recalculate Handicap',
    handicapIndexShort: 'HCPI',
    scoreDifferentialShort: 'SD',
    grossScoreShort: 'AGS',
    development: 'Development',
    confirm: 'ok',
    cancel: 'cancel',
    inconsistentIndex: 'The given HCPI does not match your calculated - you cannot save the result',
    rights: '© 2025, Brigitte Boehm. All rights reserved.',
    confirmDeleteTitle: 'Delete result',
    confirmDeleteMessage: 'Are you sure, you want to delete this result?',
    sdVsHcpiTitle: 'Score Differential vs. Handicap Index',
    sdVsHcpiText: '<p>A <strong>Score Differential</strong> is a normalized value that adjusts your actual round score (gross score) based on the difficulty of the course. It shows how well you played relative to a “scratch” golfer (handicap 0). Lower differentials mean a better round.</p>\
<p>The <strong>Handicap Index</strong>, on the other hand, represents your long-term playing ability. It is derived from your best score differentials as follows:</p>\
<ol>\
  <li>You calculate a Score Differential for each round.</li>\
  <li>You gather your last (up to) 20 differentials.</li>\
  <li>From these, you select the best (lowest) ones, average them, and apply the USGA adjustment factor—this yields your Handicap Index.</li>\
</ol>\
<p><em>In short:</em> The Score Differential is the “raw value” of each round; the Handicap Index is the profile created from your best rounds.</p>\
<p>The weighted Score Differentials used in the Handicap Index calculation are as follows:</p>\
<table>\
  <thead>\
    <tr>\
      <th>Number of Scores</th>\
      <th>Score Differentials Used for Handicap Index Calculation</th>\
      <th>Adjustment</th>\
    </tr>\
  </thead>\
  <tbody>\
    <tr><td>1</td><td>lowest</td><td>-2.0</td></tr>\
    <tr><td>2</td><td>lowest</td><td>-2.0</td></tr>\
    <tr><td>3</td><td>lowest</td><td>-2.0</td></tr>\
    <tr><td>4</td><td>lowest</td><td>-1.0</td></tr>\
    <tr><td>5</td><td>lowest</td><td>0</td></tr>\
    <tr><td>6</td><td>average of lowest 2</td><td>-1.0</td></tr>\
    <tr><td>7–8</td><td>average of lowest 2</td><td>0</td></tr>\
    <tr><td>9–11</td><td>average of lowest 3</td><td>0</td></tr>\
    <tr><td>12–14</td><td>average of lowest 4</td><td>0</td></tr>\
    <tr><td>15–16</td><td>average of lowest 5</td><td>0</td></tr>\
    <tr><td>17–18</td><td>average of lowest 6</td><td>0</td></tr>\
    <tr><td>19</td><td>average of lowest 7</td><td>0</td></tr>\
    <tr><td>20</td><td>average of lowest 8</td><td>0</td></tr>\
  </tbody>\
</table>',
    courseRatingTitle: 'What is the Course Rating?',
    courseRatingText: '<p>The <strong>Course Rating</strong> is a number that indicates how many strokes a “scratch” golfer (handicap 0) is expected to take on a specific golf course. Official course raters determine this value by evaluating layout, length, hazards, and other course factors under normal conditions. A higher Course Rating means the course is more difficult for an expert player.</p>\
<p><strong>Why does the Course Rating matter?</strong></p>\
<ul>\
  <li>It is factored into the calculation of the <em>Score Differential</em>, so that your gross score (the actual number of strokes you took) is set in relation to course difficulty.</li>\
  <li>Together with the <strong>Slope Rating</strong>, it ensures that rounds on different courses can be compared fairly.</li>\
</ul>\
<p><strong>Example (simplified):</strong></p>\
<ul>\
  <li>A Course Rating of 72.0 means a scratch golfer is expected to shoot 72 strokes on average.</li>\
  <li>If you shoot 85 strokes, the difference (85 – 72.0 = 13) is used in your Score Differential calculation.</li>\
</ul>\
<p><em>In short:</em> The Course Rating measures how hard a course is for a perfect player and ensures your Score Differential is weighted fairly on any course.</p>',

    slopeTitle: 'What is the Slope Rating?',
    slopeText: '<p>The <strong>Slope Rating</strong> measures how much more difficult a course is for a “bogey” player (approximately handicap 20–24) compared to a scratch player (handicap 0). It ranges from 55 (very easy) to 155 (very hard).</p>\
<p><strong>Why does the Slope Rating matter?</strong></p>\
<p>It complements the Course Rating to ensure players of different skill levels are compared equitably. By adjusting the Score Differential formula, it normalizes your performance relative to your playing ability.</p>\
<p><strong>Example (simplified):</strong></p>\
<ul>\
  <li>Course Rating 72.0, Slope 120.</li>\
  <li>You shoot 85 strokes.</li>\
  <li>(85 – 72.0) = 13 raw difference.</li>\
  <li>Normalization: 13 ÷ (120 ÷ 113) ≈ 12.2 Score Differential.</li>\
</ul>\
<p>If the Slope were lower (e.g., 105), you would divide by a smaller factor, producing a slightly higher Differential because the course is easier for average players.</p>\
<p><em>In short:</em> The Slope Rating accounts for how average players fare compared to scratch players, and together with Course Rating makes your Score Differential comparable across courses.</p>',

    grossScoreTitle: 'What is the Weighted Gross Score?',
    grossScoreText: '<p>The <strong>Weighted Gross Score</strong> is based on the <em>Net Double Bogey</em> per hole. It caps the number of strokes counted on each hole so that an extremely high single-hole score does not unduly inflate your handicap.</p>\
<p>For each hole, calculate:</p>\
<ul>\
  <li><strong>Par of the hole</strong> (e.g., 4)</li>\
  <li>+ <strong>Handicap strokes</strong> for that hole (based on your Course Handicap and the hole’s stroke index)</li>\
  <li>+ 2 strokes over par</li>\
</ul>\
<p>The formula is:</p>\
<p class=\'formula\'><code>Par + Handicap Strokes (for that hole) + 2</code></p>\
<p>This is the maximum Net Double Bogey counted for each hole. To get the total WGS for a round, sum these values over all 18 holes:</p>\
<p class=\'formula\'><code>WGS = ∑ (Par<sub>n</sub> + Strokes<sub>n</sub> + 2) for n = 1…18</code></p>\
<h4>Example:</h4>\
<ul>\
  <li>A player with Course Handicap 18 receives 1 extra stroke on the 18 most difficult holes.</li>\
  <li><strong>Hole 1:</strong> Par 4, Stroke Index 5 → 1 Handicap Stroke → Net Double Bogey = 4 + 1 + 2 = 7</li>\
  <li><strong>Hole 2:</strong> Par 3, Stroke Index 12 → 1 Handicap Stroke → Net Double Bogey = 3 + 1 + 2 = 6</li>\
  <li>… and so on through all 18 holes.</li>\
  <li>Sum of all 18 Net Double Bogey values = your Weighted Gross Score.</li>\
</ul>\
<p>This ensures that an extremely high score on any single hole (e.g., a 10 on a par 4) is limited to the Net Double Bogey value and does not disproportionately raise your handicap.</p>',

    pccTitle: 'What is the Playing Conditions Calculation?',
    pccText: '<p>The <strong>Playing Conditions Calculation (PCC)</strong> adjusts the Score Differentials posted on a given day when actual playing conditions differ significantly from normal course conditions. Although the Course Rating provides an accurate standard-day rating, daily factors—such as:</p>\
<ul>\
  <li>Weather (windstorms, heavy rain, extreme heat)</li>\
  <li>Tee box placements and pin positions</li>\
  <li>Course conditions after heavy rain or drought</li>\
</ul>\
<p>can greatly affect course difficulty. To account for this, all handicap‐relevant Score Differentials for the day are compared to the statistically expected results at day’s end.</p>\
<p><strong>How PCC is calculated:</strong></p>\
<ol>\
  <li>Collect all handicap‐relevant Score Differentials posted that day.</li>\
  <li>Compare those round results to the statistically expected Differentials based on Course Rating and Slope.</li>\
  <li>Determine an adjustment value (PCC), which is nonzero only if the average results deviate significantly from the norm.</li>\
  <li>Adjust each player’s posted Differential at the end of the day:<br>\
    <code>Adjusted Differential = Original Differential – PCC</code>\
  </li>\
</ol>\
<p>Immediately after finishing a round, only a provisional handicap calculation can be made because the final PCC is not determined until all of the day’s scores are evaluated. In most cases, PCC is zero, as daily conditions rarely deviate drastically from standard conditions.</p>',

    capTitle: 'What are Low Handicap Index / Cap Procedures?',
    capText: '<p>The <strong>Low Handicap Index</strong> is the lowest Handicap Index a player has achieved in the past 365 days (prior to their most recent score). It serves as a reference to prevent short‐term performance dips from immediately causing a large handicap increase.</p>\
<p><strong>Cap Procedures:</strong></p>\
<p>To ensure your Handicap Index does not jump too quickly after a minor slump, annual increases are capped as follows:</p>\
<ul>\
  <li><strong>Determine Low HI:</strong> From all Handicap Indices in the past 365 days, select the lowest value (the Low Handicap Index).</li>\
  <li><strong>Full increases up to +3:</strong> Your Handicap Index may rise up to three strokes above the Low HI if your performance worsens.</li>\
  <li><strong>Soft Cap (half‐rate increase):</strong> Once your Handicap Index is more than three strokes above the Low HI, any further increases count only at half the rate.</li>\
  <li><strong>Hard Cap (+5 limit):</strong> The maximum difference between your current Handicap Index and the Low HI is five strokes. Once this limit is reached, your Handicap Index cannot increase further, even if you continue to post poor scores.</li>\
</ul>\
<p><strong>Summary:</strong></p>\
<ol>\
  <li>Low HI = lowest Handicap Index in the past 365 days before the most recent score.</li>\
  <li>Your current HI can increase up to 3 strokes above the Low HI.</li>\
  <li>Beyond +3, additional increases count at half the rate (Soft Cap).</li>\
  <li>At +5 above the Low HI, no further HI increases are allowed (Hard Cap).</li>\
</ol>\
<p>This ensures your Handicap Index remains a realistic indicator of your best playing ability, and temporary performance dips do not immediately cause a large handicap increase.</p>',

    sdCalculationTitle: 'How is the Score Differential Calculated?',
    sdCalculationText: '<h4>1. Score Differential over 18 Holes</h4>\
<ol>\
  <li>\
    <strong>Determine the Weighted Gross Score (WGS) for 18 holes:</strong>\
    <ul>\
      <li>For each hole, calculate the <em>Net Double Bogey</em>:<br>\
        <code>Par + Handicap Strokes (for that hole) + 2</code></li>\
      <li>If you take more strokes than the Net Double Bogey on any hole, your score for that hole is automatically capped at the Net Double Bogey.</li>\
      <li>Sum all 18 Net Double Bogey values → this is your WGS<sub>18</sub>.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Calculate the Score Differential (SD):</strong>\
    <p>Once you have WGS<sub>18</sub>, apply the formula:</p>\
    <p class=\'formula\'><code>SD<sub>18</sub> = (WGS<sub>18</sub> – CR<sub>18</sub> – PCC<sub>18</sub>) × (113 / Slope)</code></p>\
    <ul>\
      <li><strong>WGS<sub>18</sub>:</strong> Your weighted gross score over 18 holes.</li>\
      <li><strong>CR<sub>18</sub>:</strong> The Course Rating for 18 holes (e.g., 72.0).</li>\
      <li><strong>PCC<sub>18</sub>:</strong> The Playing Conditions Calculation for the entire 18-hole day (usually 0 unless conditions deviated significantly).</li>\
      <li><strong>Slope:</strong> The Slope Rating of the 18-hole course.</li>\
    </ul>\
  </li>\
</ol>\
\
<h4>2. Score Differential over 9 Holes (using the 18-Hole Calculation as Reference)</h4>\
<p>If you play only 9 holes, adapt the above 18-hole method as follows:</p>\
<ol>\
  <li>\
    <strong>Determine WGS for the 9 played holes:</strong>\
    <ul>\
      <li>Calculate the <em>Net Double Bogey</em> for each of the 9 holes played:<br>\
        <code>Par + Handicap Strokes (for that hole) + 2</code></li>\
      <li>If you take more strokes than the Net Double Bogey, cap your score at the Net Double Bogey for that hole.</li>\
      <li>Sum all nine Net Double Bogey values → this is your WGS<sub>9</sub>.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Compute partial SD<sub>9, played</sub>:</strong>\
    <p>Analogous to the 18-hole formula:</p>\
    <p class=\'formula\'><code>SD<sub>9, played</sub> = (WGS<sub>9</sub> – CR<sub>9</sub> – PCC<sub>9</sub>) × (113 / Slope)</code></p>\
    <ul>\
      <li><strong>WGS<sub>9</sub>:</strong> Weighted gross score for the nine holes played.</li>\
      <li><strong>CR<sub>9</sub>:</strong> The Course Rating for those nine holes (e.g., 36.0).</li>\
      <li><strong>PCC<sub>9</sub>:</strong> PCC for the 9-hole segment (usually 0).</li>\
      <li><strong>Slope:</strong> The Slope Rating of the full 18-hole course (still normalized to 113).</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Calculate SD<sub>9, unplayed</sub> for the nine unplayed holes:</strong>\
    <p>You then supplement your 9-hole performance with a statistical differential for the nine holes not played:</p>\
    <p class=\'formula\'><code>SD<sub>9, unplayed</sub> = ((HCPI × 1.04) + 2.4) ÷ 2</code></p>\
    <ul>\
      <li><strong>HCPI:</strong> Your current Handicap Index.</li>\
      <li>This value represents what you would statistically shoot over nine holes on a “neutral” course (Par 72, CR 72, Slope 113). You can look it up in the 9-hole SD adjustment table under your HCPI.</li>\
    </ul>\
  </li>\
  <li>\
    <strong>Combine to form SD<sub>18</sub> (for handicap posting):</strong>\
    <p>Add the two 9-hole differentials together:</p>\
    <p class=\'formula\'><code>SD<sub>18</sub> = SD<sub>9, played</sub> + SD<sub>9, unplayed</sub></code></p>\
    <p>This <em>SD<sub>18</sub></em> is used in your scoring record as if it were a full 18-hole round. In case of rounding differences, the handicap server’s calculation is authoritative.</p>\
  </li>\
</ol>',

    breakTitle: 'What is the “26.5 Cap” and how do handicaps between 26.5 and 54 work?',
    breakText: '<p>The <strong>“26.5 Cap”</strong> means that players with a <em>current Handicap Index</em> between 26.5 and 54 may only <strong>improve</strong> their index. If performance declines so that the “calculated Handicap Index” (without the cap) would rise above 26.5, the lowest Handicap Index the player has ever achieved in that range is used as their “actual” index.</p>\
<p><strong>How does this work in practice?</strong></p>\
<ul>\
  <li>A player has a Handicap Index of <strong>26.5</strong> (or any value between 26.5 and 54). If they play poorly and their calculated index would exceed 26.5, their <em>actual index</em> remains at 26.5.</li>\
  <li>Example: If a player’s lowest recorded index in that range was <strong>26.0</strong> and, after a bad round, the calculated index rises to 27.0, they continue to be rated at 26.0.</li>\
  <li>This mechanism prevents a player from immediately receiving a substantially higher handicap after a minor slump. As a result, many golfers remain at 26.5 or at the lowest value they have reached within that range for a long time.</li>\
</ul>\
<p><strong>Summary:</strong></p>\
<ol>\
  <li>For Handicap Indices between 26.5 and 54, only improvements (lower indices) are allowed.</li>\
  <li>Whenever the calculated index in that range rises, you stay at the lowest index you have ever reached in that range.</li>\
  <li>If desired, you can choose to remove the “26.5 Cap” yourself to be played with your higher calculated index.</li>\
</ol>',
    faqTitle: 'Frequently Asked Questions',
    settingsTitle: 'Settings',
    selectLanguage: 'Select Language',
    downloadRules: 'Download current Handicap-Rules',
    legal: 'Legal',
    impressum: 'Impressum',
    dataProtection: 'Data Protection',

    holesPlayedInfo: "Select whether you played 9 or 18 holes. For 9 holes, the result will be adjusted accordingly.",
    handicapIndexInfo: "This is your last saved handicap index (pre-filled).",
    courseRatingInfo: "Course rating (e.g., 72.0).",
    slopeInfo: "Slope rating of the course (e.g., 113).",
    grossScoreInfo: "Total strokes for 9 or 18 holes.",
    pccInfo: "PCC = Playing Conditions Calculation, usually between –1.0 and +3.0.",
    projectedHandicap: "Projected Handicap Index",
    saveModalTitle: "Save Result",
    courseNameOptional: "Course Name (optional)",
    errorHolesRequired: "Please select 9 or 18 holes.",
    errorHandicapInvalid: "Invalid handicap index.",
    errorCourseRating: "Please enter a valid course rating.",
    errorSlope: "Please enter a valid slope rating.",
    errorGrossScore: "Please enter a valid gross score.",
    errorPccInvalid: "PCC value must be between –1.0 and 3.0.",
    errorDateRequired: "Please select a date.",
    yourStats: "Your Statistics",
    lastHandicap: "Last HI",
    roundCount: "Total Rounds",
    lowestHI12mo: "Lowest HI (12 months)",
    avgDiff5: "Avg Diff (last 5)",

    handicapChartTitle: "Handicap-Entwicklung",
    aboutApp: "About this App",
    appVersion: "Version: 1.0",
    appAuthor: "Developed by Brigitte Boehm",

    holesPlayedTooltip: "Select whether you played 9 or 18 holes. For 9 holes, the result is adjusted accordingly.",
    navCalculator: "Calculator",
    navHistory: "History",
    navSettings: "Settings",
    courseRatingShort: 'CR',
    slopeShort: 'Slope',

    hiShort: 'HI',
    close: 'Close',
    diffShort: 'SD',
detailTitle: "Round-details",
navFaq: 'FAQ',

  },
  de: {
    calculatorTitle: 'HandyCap',
    calculatorIntro: 'Mit HandyCap kannst du dein Score Differential für 9 oder 18 Löcher bestimmen und dein Handicap verwalten.\
        Gib dein aktuelles Handicap (HCPI), dein gewertetes Bruttoergebnis (GBE), das Course Rating (CR), den Slope und die Korrektur ein, um dein individuelles Ergebnis zu errechnen.',
    chooseOption: 'Wähle...',
    holes: 'Löcher',
    holesPlayed: 'Gespielte Löcher',
    forExample: 'z.B.',
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
    reset: "Zurücksetzen",
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
    confirmDeleteTitle: "Löschen bestätigen",
    confirmDeleteMessage: "Möchtest du diesen Eintrag wirklich löschen?",
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


  },
}

// 2) Erzeuge das i18n-Plugin
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'de',
  messages,
  warnHtmlMessage: false
})

const app = createApp(App)
app.use(i18n)
app.use(router)
app.mount('#app')
