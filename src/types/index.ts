// Shared TypeScript types for the app. Exported from src/types/
// Derived from MVP_1.md (Types section)

export type MetricType =
  | 'streak'
  | 'count_in_time'
  | 'points_total'
  | 'stations_cleared'
  | 'corridor_hits'
  | 'score_vs_par';

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
    hcpTargets: Record<string, number[]>;
  };

  tags?: string[];
  zockerTip?: string;
  variants?: string[];
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
