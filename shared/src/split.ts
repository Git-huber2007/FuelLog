import { weekdayOf } from './dates';

export const MUSCLE_GROUPS = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'core', 'lowerback', 'quads', 'hamstrings', 'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const FRONT_MUSCLES: readonly MuscleGroup[] = ['shoulders', 'chest', 'core', 'biceps', 'quads', 'calves'];
export const BACK_MUSCLES: readonly MuscleGroup[] = ['shoulders', 'back', 'lowerback', 'triceps', 'hamstrings', 'calves'];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps', back: 'Back', biceps: 'Biceps',
  core: 'Core', lowerback: 'Lower back', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export const EXERCISE_KINDS = [
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'assisted_bodyweight',
  'duration',
  'cardio',
] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export interface Exercise {
  key: string;
  name: string;
  sets: number;
  topReps: number;
  prescription: string;
  kind: ExerciseKind;
  /** Muscle and level, shown on exercises added from the library. */
  detail?: string;
}

export interface SplitDay {
  title: string;
  muscles: MuscleGroup[];
  exercises: Exercise[];
}

const ex = (day: string, name: string, sets: number, topReps: number, reps = String(topReps), kind: ExerciseKind = 'weight_reps'): Exercise => ({
  key: `${day}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  sets,
  topReps,
  prescription: `${sets}×${reps}`,
  kind,
});

/** Indexed by weekday: 0 = Sunday … 6 = Saturday. */
export const SPLIT: readonly SplitDay[] = [
  { title: 'Rest', muscles: [], exercises: [] },
  {
    title: 'Push · chest',
    muscles: ['chest', 'shoulders', 'triceps'],
    exercises: [
      ex('mon', 'Bench press', 3, 10, '8–10'),
      ex('mon', 'Incline dumbbell press', 3, 10),
      ex('mon', 'Shoulder press', 3, 10),
      ex('mon', 'Lateral raise', 3, 15, '12–15'),
      ex('mon', 'Triceps pushdown', 3, 12),
    ],
  },
  {
    title: 'Pull · back width',
    muscles: ['back', 'biceps'],
    exercises: [
      ex('tue', 'Lat pulldown', 3, 10),
      ex('tue', 'Seated cable row', 3, 10),
      ex('tue', 'Face pull', 3, 15),
      ex('tue', 'Dumbbell curl', 3, 12),
      ex('tue', 'Hammer curl', 2, 12),
    ],
  },
  {
    title: 'Arms and core',
    muscles: ['biceps', 'triceps', 'core'],
    exercises: [
      ex('wed', 'EZ-bar curl', 3, 10),
      ex('wed', 'Close-grip bench or dips', 3, 10, '10', 'weight_reps'),
      ex('wed', 'Incline dumbbell curl', 3, 12),
      ex('wed', 'Rope pushdown', 3, 12),
      ex('wed', 'Plank', 3, 45, '30–45 s', 'duration'),
      ex('wed', 'Hanging knee raise', 3, 10, '10', 'bodyweight_reps'),
      ex('wed', 'Cable crunch', 3, 12),
    ],
  },
  {
    title: 'Push · shoulders',
    muscles: ['shoulders', 'chest', 'triceps'],
    exercises: [
      ex('thu', 'Overhead press', 3, 10, '8–10'),
      ex('thu', 'Incline bench or machine press', 3, 10),
      ex('thu', 'Chest fly', 3, 12),
      ex('thu', 'Lateral raise', 3, 15),
      ex('thu', 'Overhead triceps extension', 3, 12),
    ],
  },
  {
    title: 'Pull · back thickness',
    muscles: ['back', 'lowerback', 'shoulders'],
    exercises: [
      ex('fri', 'Barbell or dumbbell row', 3, 10, '8–10'),
      ex('fri', 'Assisted pull-up or pulldown', 3, 10, '10', 'assisted_bodyweight'),
      ex('fri', 'Rear delt fly', 3, 15),
      ex('fri', 'Back extension', 2, 12, '12', 'bodyweight_reps'),
      ex('fri', 'Shrugs', 3, 12),
    ],
  },
  {
    title: 'Legs',
    muscles: ['quads', 'hamstrings', 'calves'],
    exercises: [
      ex('sat', 'Squat or leg press', 4, 10, '8–10'),
      ex('sat', 'Romanian deadlift', 3, 10, '8–10'),
      ex('sat', 'Walking lunge', 2, 10, '10 per leg'),
      ex('sat', 'Leg extension', 3, 12),
      ex('sat', 'Leg curl', 3, 12),
      ex('sat', 'Calf raise', 4, 15),
    ],
  },
];

const ALL_EXERCISES = SPLIT.flatMap((d) => d.exercises);
export const EXERCISE_KEYS: ReadonlySet<string> = new Set(ALL_EXERCISES.map((e) => e.key));
export const EXERCISE_NAMES: ReadonlyMap<string, string> = new Map(ALL_EXERCISES.map((e) => [e.key, e.name]));

// The shorter programs reuse the six-day exercises under the same keys, so photos, history and overload hints carry over when a user switches.
export const SPLIT_EXERCISES_BY_KEY: ReadonlyMap<string, Exercise> = new Map(ALL_EXERCISES.map((e) => [e.key, e]));
const BY_KEY = SPLIT_EXERCISES_BY_KEY;
const day = (title: string, muscles: MuscleGroup[], ...keys: string[]): SplitDay => ({ title, muscles, exercises: keys.map((k) => BY_KEY.get(k)!) });
const REST = SPLIT[0];
const LEGS = ['sat-squat-or-leg-press', 'sat-romanian-deadlift', 'sat-walking-lunge', 'sat-leg-extension', 'sat-leg-curl', 'sat-calf-raise'];

export const PROGRAM_KEYS = ['full_body', 'upper_lower', 'six_day', 'arnold_six_day', 'custom'] as const;
export type ProgramKey = (typeof PROGRAM_KEYS)[number];

export interface Program {
  name: string;
  summary: string;
  /** Indexed by weekday: 0 = Sunday … 6 = Saturday. */
  days: readonly SplitDay[];
}

export const PROGRAMS: Record<ProgramKey, Program> = {
  full_body: {
    name: 'Full body · 3 days',
    summary: 'Monday, Wednesday, Friday. Every muscle three times a week with a rest day between sessions.',
    days: [
      REST,
      day('Full body A', ['quads', 'chest', 'back', 'shoulders', 'core'],
        'sat-squat-or-leg-press', 'mon-bench-press', 'tue-lat-pulldown', 'mon-shoulder-press', 'wed-plank'),
      REST,
      day('Full body B', ['hamstrings', 'chest', 'back', 'shoulders', 'biceps', 'core'],
        'sat-romanian-deadlift', 'mon-incline-dumbbell-press', 'tue-seated-cable-row', 'mon-lateral-raise', 'tue-dumbbell-curl', 'wed-cable-crunch'),
      REST,
      day('Full body C', ['quads', 'shoulders', 'back', 'triceps', 'hamstrings', 'calves'],
        'sat-walking-lunge', 'thu-overhead-press', 'fri-barbell-or-dumbbell-row', 'mon-triceps-pushdown', 'sat-leg-curl', 'sat-calf-raise'),
      REST,
    ],
  },
  upper_lower: {
    name: 'Upper / lower · 4 days',
    summary: 'Monday and Thursday upper body, Tuesday and Friday lower body. Each muscle twice a week.',
    days: [
      REST,
      day('Upper body A', ['chest', 'back', 'shoulders', 'triceps', 'biceps'],
        'mon-bench-press', 'tue-seated-cable-row', 'mon-shoulder-press', 'tue-lat-pulldown', 'mon-lateral-raise', 'mon-triceps-pushdown', 'tue-dumbbell-curl'),
      day('Lower body A', ['quads', 'hamstrings', 'calves', 'core'], ...LEGS, 'wed-plank'),
      REST,
      day('Upper body B', ['shoulders', 'back', 'chest', 'biceps', 'triceps'],
        'thu-overhead-press', 'fri-barbell-or-dumbbell-row', 'thu-incline-bench-or-machine-press', 'fri-assisted-pull-up-or-pulldown', 'thu-chest-fly', 'wed-ez-bar-curl', 'wed-rope-pushdown'),
      day('Lower body B', ['quads', 'hamstrings', 'calves', 'core'], ...LEGS, 'wed-hanging-knee-raise'),
      REST,
    ],
  },
  six_day: {
    name: 'Push / pull / arms / legs · 6 days',
    summary: 'Monday to Saturday, one focus a day. The most volume, for people who already train regularly.',
    days: SPLIT,
  },
  arnold_six_day: {
    name: 'Arnold split · 6 days',
    summary: 'Chest & Triceps, Back & Biceps, Shoulder & Abs rotated twice a week with Saturday Legs & Abs. Sunday rest.',
    days: [
      REST,
      day('Chest & Triceps', ['chest', 'triceps'],
        'mon-bench-press', 'mon-incline-dumbbell-press', 'thu-chest-fly', 'mon-triceps-pushdown', 'thu-overhead-triceps-extension'),
      day('Back & Biceps', ['back', 'biceps'],
        'tue-lat-pulldown', 'tue-seated-cable-row', 'fri-barbell-or-dumbbell-row', 'tue-dumbbell-curl', 'tue-hammer-curl'),
      day('Shoulder & Abs', ['shoulders', 'core'],
        'thu-overhead-press', 'mon-lateral-raise', 'tue-face-pull', 'fri-rear-delt-fly', 'wed-cable-crunch', 'wed-hanging-knee-raise', 'wed-plank'),
      day('Chest & Triceps', ['chest', 'triceps'],
        'thu-incline-bench-or-machine-press', 'mon-bench-press', 'wed-close-grip-bench-or-dips', 'wed-rope-pushdown', 'thu-overhead-triceps-extension'),
      day('Back & Biceps', ['back', 'biceps'],
        'fri-barbell-or-dumbbell-row', 'fri-assisted-pull-up-or-pulldown', 'fri-shrugs', 'wed-ez-bar-curl', 'wed-incline-dumbbell-curl'),
      day('Legs & Abs', ['quads', 'hamstrings', 'calves', 'core'],
        ...LEGS, 'wed-hanging-knee-raise'),
    ],
  },
  custom: {
    name: 'Custom routine',
    summary: 'Your personalized workout routine built day by day.',
    days: [REST, REST, REST, REST, REST, REST, REST],
  },
};

/** The program suggested for a training level. The user can still pick any of them. */
export const recommendedProgram = (level: 'beginner' | 'intermediate' | 'expert'): ProgramKey =>
  level === 'beginner' ? 'full_body' : level === 'intermediate' ? 'upper_lower' : 'six_day';

export const splitFor = (iso: string, program: ProgramKey = 'six_day', customDay?: SplitDay | null): SplitDay =>
  program === 'custom' ? (customDay ?? { title: 'Rest', muscles: [], exercises: [] }) : PROGRAMS[program].days[weekdayOf(iso)];
