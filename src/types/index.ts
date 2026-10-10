// Shared TypeScript types for the app. Exported from src/types/
// Derived from MVP_1.md (Types section)

export type MetricType =
  | 'streak'
  | 'count_in_time'
  | 'points_total'
  | 'stations_cleared'
  | 'corridor_hits'
  | 'score_vs_par'
  | 'score'
  | 'count'
  | 'sum'
  | 'time'
  | 'qualitative'
  | 'dual'
  | 'series'
  | 'record'
  | 'scorecard'
  | 'binary'
  | 'comparison'
  | 'points'
  | 'rating';

export interface Drill {
  id: string;
  title: string;
  category: string;

  equipment: {
    balls?: number;
    clubs?: string[];
    other?: string[];
  };

  setup: {
    schema: string;
    diagram?: string;
    location?: string;
  };

  duration: {
    suggestedMin?: number;
    hardStop?: number;
    timerPreset?: number;
  };

  difficulty?: {
    base: number;
    scale: '1-5';
  };

  instructions: {
    training: string;
    test?: string;
    tooEasy?: string;
  };

  metric: {
    type: MetricType;
    unit: string;
    /** Inclusive bounds for the entered value (e.g. [1, 5] for a self-rating). Defaults to metric-type rules. */
    range?: [number, number];
    /** Hit radius in metres per HCP bucket for drills where the radius (not the score) scales with handicap. */
    hcpRadius?: Record<string, number>;
    /** Up to three thresholds (level 1-3); a level is reached when the result meets that many of them. */
    hcpTargets: Record<string, number[]>;
    /** If true, smaller metric values are better (e.g. fewer strokes). Defaults to false. */
    smallerIsBetter?: boolean;
  };

  tags?: string[];
  zockerTip?: string;
  variants?: string[];
  /** Short human-readable summary to display on cards and lists. Optional. */
  summary?: string;
}

export interface Session {
  id: string;
  drillId: string;
  date: string; // ISO string
  hcp: number;
  timerUsed?: number;
  attempts?: number;
  result: { value: number; unit: string };
  levelReached?: number;
  favorited?: boolean;
  notes?: string;
}
