# 1) Data model (MVP-fixed)

Short & expandable. A drill is a “template” + HCP-dependent measurement logic. A **session** stores results/history.

### Drill (JSON)

```json
{
  “id”: “putting_360”,
  “title”: “360° Putting,”
  “category”: “Putting,”
  “source”: “JAM-POI,”
  “equipment”: { “balls”: 3, “clubs”: [“Putter”], ‘other’: [“8 Tees”] },
  “setup”: {
    “schema”: “8 tees in a circle with a 90 cm radius around a hole”,
    “diagram”: “circle_8@90cm”, 
    “location”: “Putting Green”
  },
  “duration”: { “suggestedMin”: 5, ‘hardStop’: 5, “timerPreset”: 300 },
  “difficulty”: { “base”: 2, ‘scale’: “1-5” },
  “instructions”: {
    “training”: “Putt as many putts as possible in a row, then move on to the next tee in a clockwise direction.”,
    “test”: “Highest streak in 5 minutes.”,
    “tooEasy”: “Increase the distance by 10 cm each time.”
  },
  “metric”: {
    “type”: “streak”, 
    “unit”: “Putts in a row”,
    “hcpTargets”: {
      “54-27”: [2,4,6],
      “26-12”: [8,10,12],
      “11-0”: [15,17,20]
    }
  },
  “tags”: [‘Consistency’, “Short putts”],
  “gamerTip”: “Play head-to-head, who will be the first to break their streak?”,
  “variants”: []
}
```

### Session (results log)

```json
{
  “id”: “sess_2025-10-25T10:32Z_putting_360”,
  “drillId”: “putting_360”,
  “date”: “2025-10-25T10:32:00Z”,
  “hcp”: 18,
  “timerUsed”: 300,
  “attempts”: 41,
  “result”: { “value”: 12, ‘unit’: “Putts in series” },
  “levelReached”: 2,          
  “favorited”: false,
  “notes”: “Left slope, solid starting line.”
}
```

### Why:

* **equipment/setup/duration/instructions** give you the “clear” drill cards.
* **metric + hcpTargets** provides “am I already at level n?”
* **Session** separates drill definition and measured runs → history/trends easy.

> Additional types for other measurement types (just change the `metric.type` field):
> `streak`, `count_in_time`, `points_total`, `stations_cleared`, `corridor_hits`, `score_vs_par`

# 2) UI/Interaction (MVP)

## A. Drill details (one card)

* Header: Title, category, “☆ Favorite” toggle.
* **What do I need?** (Equipment icons + number of balls/clubs).
* **Setup** (short text + small pictogram/diagram).
* **Duration/timer** (start/stop, preset from drill).
* **Procedure** (training/test, short & concise).
* **Requirement/measurement value**

* Compact **HCP target table** (your range is highlighted).
* Input field(s) for measurement value (e.g., “highest series,” “points,” “hits”).
* Primary CTA: **“Start session”** → timer runs, input activated.
* Secondary: **“Gambler's tip”** as a collapsible panel.
* Footer: **“Save”** → new session in history.

## B. History & Progress

* Per drill: **Sparklines** (last 10 sessions), **best score**, **Ø 5-MA**, **trend arrow**.
* Global: Filter (category, time period), **“Areas for improvement”** view:

    * “Below target level” (below your HCP level),
* “Stagnant” (trend ~0),
* “Most improved.”

## C. Shuffle (keep)

* Floating action button **“Shuffle”** → slot machine overlay:

    * 3 columns: *Category*, *Drill*, *Target type* (optional).
    * Reel/stop one after the other → “one-armed bandit” vibe.
    * Result: lands on drill detail with “Start session.”

## D. Favorites

* Star on drill card; “Favorites” filter in lists + shuffle bias (“more from favorites”).

## E. Gamer function

* Collapsible panel on drill detail (not mandatory for MVP):

    * Peer modes (match play variant), handicap offset, small points logic.

# 3) Gamification (easy, MVP-compatible)

* **Level badges per drill** (1-3) according to `hcpTargets`.
* **Streaks**: “5 days of training in a row.”
* **“PB!”** toast for personal best.
* (Later) **Mini-quests**: “3 putting drills in 20 min.”

# 4) Tech/State & Storage

* **Vue 3 + Vite + Tailwind**, **Pinia** for state.
* **Storage**: LocalStorage/IndexedDB (sessions, favorites).

* Structure: `drills.json` (read-only), `sessions[]`, `favorites[]`, `settings{hcp,handedness,…}`.
* **HCP logic**: User enters HCP → UI highlights the appropriate target column.

# 5) Types (TS interfaces - short)

```ts
type MetricType = “streak”|“count_in_time”|“points_total”|“stations_cleared”|‘corridor_hits’|“score_vs_par”;

interface Drill {
    id: string; title: string; category: string; source?: string;
    equipment: { balls?: number; clubs?: string[]; other?: string[] };
    setup: { schema: string; diagram?: string; location?: string };
    duration: { suggestedMin?: number; hardStop?: number;
    difficulty?: { base: number; scale: "1-5" };
    instructions: { training: string; test?: string; tooEasy?: string };
    metric: { type: MetricType; unit: string; hcpTargets: Record<string, number[]> };
    tags?: string[]; zockerTip?: string; variants?: string[];
}

interface Session {
  id: string; drillId: string; date: string; hcp: number;
  timerUsed?: number; attempts?: number;
  result: { value: number; unit: string };
  levelReached?: number; favorited?: boolean; notes?: string;
}
```

# 6) Result evaluation (level & trend)

* **Level determination:**

  * Get HCP bucket (e.g., “26-12”).
  * Compare `result.value` with `[L1,L2,L3]` → `levelReached`.

* **Trend:**

  * Moving average of the last 5 sessions vs. average of the previous 5 → ↑ / → / ↓.

# 7) Timer integration

* Simple stopwatch with preset (e.g., 5:00).
* Auto-log `timerUsed` when saving.
* Optional: **“+1 hit”** quick button for `count_in_time` drills.

# 8) Two sample drills (different measurement types)

### a) Range - “14 Fairways” (corridor hits)

```json
{
  "id": "range_14_fairways",
  "title": "14 Fairways",
  "category": "Driving Range",
  "equipment": { "balls": 28, "clubs": ["Driver","Eisen 7"] },
  "setup": { "schema": "Zielkorridor >30 m Breite, 14 Driver + 14 Eisen", "location": "Range" },
  "duration": { "suggestedMin": 20, "timerPreset": 1200 },
  "instructions": {
    "training": "Je 14 Bälle mit Driver/Eisen in den Korridor. Zähle nur Treffer.",
    "tooEasy": "Flugkurven variieren, Korridor schmaler."
  },
  "metric": {
    "type": "corridor_hits",
    "unit": "Treffer",
    "hcpTargets": { "54-27": [4,7,11], "26-12": [7,9,11], "11-0": [11,13,14] }
  },
  "tags": ["Abschlag","Richtungskontrolle"]
}
```

### b) Chipping - „Carry Zone“ (stations cleared / streak)

```json
{
  "id": "chip_carry_zone",
  "title": "Carry Zone",
  "category": "Chipping Green",
  "equipment": { "balls": 6, "clubs": ["Wedge"], "other": ["6 Schläger/Markierungen"] },
  "setup": { "schema": "6 Landebänder im Meterabstand, Start 2 m vom Chip-Punkt", "location": "Chipping Green" },
  "duration": { "suggestedMin": 5, "timerPreset": 300 },
  "instructions": {
    "training": "Abwechselnd kurz→lang die Carry-Zonen treffen. Längste fehlerfreie Serie zählt.",
    "test": "Höchstserie in 5 Min.",
    "tooEasy": "Nach jedem Schlag Schläger wechseln oder Bänder enger."
  },
  "metric": {
    "type": "streak",
    "unit": "Zonen in Serie",
    "hcpTargets": { "54-27": [2,3,4], "26-12": [5,7,9], "11-0": [11,13,15] }
  },
  "tags": ["Längenkontrolle","Kontakt"]
}
```

# 9) Identify areas for improvement (measurable success)

* Per category **Skill score** (0-100) = normalized average of your last level ratings.
* **Radar/bar view**: Putting | Chipping | Pitch/pitching | Bunker | Range | Course.
* List of “**Biggest levers**” = drills with

* frequently below level target **and**
* high correlation to course stats (FIR/GIR/putts) - (later, when course drills are logged).

# 10) Next steps

1. I'll add **10-12 core drills** (1-2 per category) to JSON right away so you can test the flow.
2. Vue components: `DrillList.vue`, `DrillDetail.vue`, `SessionForm.vue`, `StatsView.vue`, `ShuffleOverlay.vue`.
3. Easy slot machine: CSS transform + `requestAnimationFrame`, sequential stop (category → drill → target type).