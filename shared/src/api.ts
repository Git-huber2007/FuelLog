// Shapes of database rows and API responses, shared so the client and server cannot drift apart.
import type { Advice } from './advice';
import type { CheckInput, CoachResult, Goal, LogSource, Meal, MeasureInput, RoutineExerciseInput, Sex } from './schemas';
import type { Level } from './library';
import type { Exercise, ExerciseKind, MuscleGroup, ProgramKey } from './split';
import type { MacroTotals, Targets } from './targets';

export interface Profile {
  id: string;
  sex: Sex | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: Goal;
  level: Level;
  program: ProgramKey;
  kcal_adjust: number;
  last_adjusted_on: string | null;
  onboarded: boolean;
}

export interface ProfileResponse {
  profile: Profile;
  targets: Targets | null;
  aiEnabled: boolean;
}

export interface Food extends MacroTotals {
  id: string;
  owner_id: string | null;
  name: string;
  serving_label: string;
  category: string;
  barcode: string | null;
}

export interface FoodLog extends MacroTotals {
  id: string;
  log_date: string;
  meal: Meal;
  food_id: string | null;
  name: string;
  servings: number;
  source: LogSource;
  created_at: string;
}

export interface WorkoutSet {
  log_date: string;
  exercise_key: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  /** Cardio only: gradient in percent, negative for a decline. */
  incline_pct: number | null;
  /** True for cardio exercises from the library. */
  cardio?: boolean;
  kind?: ExerciseKind;
  is_pr?: boolean;
}

export type Measurements = MeasureInput & { log_date: string };

export interface DayResponse {
  date: string;
  logs: FoodLog[];
  check: CheckInput | null;
  weight_kg: number | null;
  measurements: Measurements | null;
  sets: WorkoutSet[];
  targets: Targets;
  /** High-protein foods the nudge line can suggest. */
  proteinFoods: { name: string; kcal: number; protein_g: number }[];
}

export interface WorkoutExercise extends Exercise {
  logged: WorkoutSet[];
  last: { date: string; sets: WorkoutSet[] } | null;
  overload: boolean;
  /** Added by the user from the library, on top of the day's fixed plan. */
  extra: boolean;
}

export interface WorkoutResponse {
  date: string;
  title: string;
  muscles: MuscleGroup[];
  exercises: WorkoutExercise[];
  program: ProgramKey;
  programName: string;
}

/** One serving of a recently logged food, ready to log again. */
export interface RecentFood extends MacroTotals {
  food_id: string | null;
  name: string;
  source: LogSource;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: (MacroTotals & { name: string })[];
}

export interface MeasureDelta {
  first: number;
  latest: number;
  delta: number;
}

export interface ProgressResponse {
  weights: { log_date: string; weight_kg: number; avg7: number }[];
  calories: { date: string; kcal: number; target: number }[];
  summary: {
    daysLogged: number;
    avgKcal: number | null;
    avgProtein: number | null;
    proteinHitDays: number;
    workouts: number;
    avgSleep: number | null;
    avgWater: number | null;
    avgSteps: number | null;
  };
  measurements: Record<keyof MeasureInput, MeasureDelta | null>;
  streak: number;
  advice: Advice;
  topLifts?: TopLiftSummary[];
}

export interface Photo {
  id: string;
  log_date: string;
  url: string | null;
}

export interface AiParseResponse {
  entries: FoodLog[];
  note: string;
}

export type CoachResponse = CoachResult;

export interface RoutineDayRow {
  weekday: number;
  title: string;
  exercises: RoutineExerciseInput[];
}

export interface ExerciseHistoryPoint {
  date: string;
  metric: number;
  formatted: string;
}

export interface ExercisePRMilestone {
  date: string;
  value: number;
  formatted: string;
}

export interface ExerciseSessionHistory {
  date: string;
  sets: WorkoutSet[];
  bestMetric: number;
  volumeKg: number;
}

export interface ExerciseHistoryResponse {
  key: string;
  name: string;
  kind: ExerciseKind;
  metricName: string;
  metricUnit: string;
  chartPoints: ExerciseHistoryPoint[];
  prs: ExercisePRMilestone[];
  recentSessions: ExerciseSessionHistory[];
}

export interface TopLiftSummary {
  key: string;
  name: string;
  kind: ExerciseKind;
  totalSessions: number;
  latestDate: string;
  latestMetric: string;
  trend: 'up' | 'flat' | 'down';
  trendDelta: string;
}
