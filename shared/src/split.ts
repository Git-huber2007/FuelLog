import { weekdayOf } from './dates';

export const MUSCLE_GROUPS = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'core', 'lowerback', 'quads', 'hamstrings', 'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const FRONT_MUSCLES: readonly MuscleGroup[] = ['shoulders', 'chest', 'core', 'biceps', 'quads', 'calves'];
export const BACK_MUSCLES: readonly MuscleGroup[] = ['shoulders', 'back', 'lowerback', 'triceps', 'hamstrings', 'calves'];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps', back: 'Back', biceps: 'Biceps',
  core: 'Core', lowerback: 'Lower back', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export interface Exercise {
  key: string;
  name: string;
  sets: number;
  topReps: number;
  prescription: string;
  /** Logged as distance and minutes, not weight and reps. */
  cardio?: boolean;
  /** Muscle and level, shown on exercises added from the library. */
  detail?: string;
}

export interface SplitDay {
  title: string;
  muscles: MuscleGroup[];
  exercises: Exercise[];
}

const ex = (day: string, name: string, sets: number, topReps: number, reps = String(topReps)): Exercise => ({
  key: `${day}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  sets,
  topReps,
  prescription: `${sets}×${reps}`,
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
      ex('wed', 'Close-grip bench or dips', 3, 10),
      ex('wed', 'Incline dumbbell curl', 3, 12),
      ex('wed', 'Rope pushdown', 3, 12),
      ex('wed', 'Plank', 3, 45, '30–45 s'),
      ex('wed', 'Hanging knee raise', 3, 10),
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
      ex('fri', 'Assisted pull-up or pulldown', 3, 10),
      ex('fri', 'Rear delt fly', 3, 15),
      ex('fri', 'Back extension', 2, 12),
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

export const splitFor = (iso: string): SplitDay => SPLIT[weekdayOf(iso)];

const ALL_EXERCISES = SPLIT.flatMap((d) => d.exercises);
export const EXERCISE_KEYS: ReadonlySet<string> = new Set(ALL_EXERCISES.map((e) => e.key));
export const EXERCISE_NAMES: ReadonlyMap<string, string> = new Map(ALL_EXERCISES.map((e) => [e.key, e.name]));
