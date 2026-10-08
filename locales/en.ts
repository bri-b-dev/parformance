export const en = {
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
  <li>From these, you select the best (lowest) ones, average them, and apply the USGA adjustment factor-this yields your Handicap Index.</li>\
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
  pccText: '<p>The <strong>Playing Conditions Calculation (PCC)</strong> adjusts the Score Differentials posted on a given day when actual playing conditions differ significantly from normal course conditions. Although the Course Rating provides an accurate standard-day rating, daily factors-such as:</p>\
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

  // PDF Import
  importPdf: 'Import Scoring Record',
  importModalTitle: 'Import Rounds from Scoring Record',
  importPreviewInfo: 'The following rounds were detected. SD values are taken directly from the Scoring Record (official handicap server value). Please review before importing.',
  importConfirm: 'Import all',
  importCancel: 'Cancel',
  importSuccess: 'round(s) successfully imported.',
  importError: 'Error reading the PDF file.',
  importNothingFound: 'No valid rounds were found in the PDF.',
  importDuplicateSkipped: 'round(s) skipped (already exist).',
  importColHoles: 'Holes',
  importColCR: 'CR',
  importColSlope: 'Slope',
  importColGBE: 'GBE',
  importColSD: 'SD (calculated)',
  importLoading: 'Processing PDF…',
  recalcNotice: 'Calculation corrected: only the most recent 20 rounds count. Recalculated entries:',
  importEnriched: 'round(s) updated with course data (CR, slope, holes).',
  importEnrichInfo: 'existing round(s) will be updated with course data (CR, slope, holes).',
  importSelected: '{n} selected',
};
