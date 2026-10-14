// The optional exercise library: about 870 public-domain exercises from free-exercise-db that a user can add to any day.
import rows from './exerciseLibrary.json';
import { EXERCISE_KEYS, EXERCISE_NAMES, SPLIT, SPLIT_EXERCISES_BY_KEY, type Exercise, type ExerciseKind, type MuscleGroup } from './split';

export const LEVELS = ['beginner', 'intermediate', 'expert'] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<Level, string> = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Advanced' };

export const EXERCISE_TYPES = ['strength', 'cardio', 'stretching', 'plyometrics'] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export interface LibraryExercise {
  /** Also the exercise_key stored with logged sets. At most 60 characters. */
  id: string;
  name: string;
  level: Level;
  type: ExerciseType;
  muscle: string;
  equipment: string | null;
}

export const LIBRARY: readonly LibraryExercise[] = (rows as [string, string, Level, ExerciseType, string, string | null][]).map(
  ([id, name, level, type, muscle, equipment]) => ({ id, name, level, type, muscle, equipment }),
);
export const LIBRARY_MUSCLES: readonly string[] = [...new Set(LIBRARY.map((e) => e.muscle))].sort();
export const LIBRARY_EQUIPMENTS: readonly string[] = [...new Set(LIBRARY.map((e) => e.equipment).filter((eq): eq is string => Boolean(eq)))].sort();

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));

export const libraryExercise = (key: string) => BY_ID.get(key);
export const isKnownExercise = (key: string) => EXERCISE_KEYS.has(key) || BY_ID.has(key);
export const exerciseName = (key: string) => EXERCISE_NAMES.get(key) ?? BY_ID.get(key)?.name ?? key;
export const lookupExerciseKind = (key: string): ExerciseKind => {
  const splitEx = SPLIT_EXERCISES_BY_KEY.get(key);
  if (splitEx) return splitEx.kind;
  const lib = BY_ID.get(key);
  if (lib) return deriveExerciseKind(lib);
  return 'weight_reps';
};

const title = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * Derives an exercise kind from its category, equipment and name.
 * Cardio exercises become cardio; bodyweight and holds/stretches do not ask for external load.
 */
export function deriveExerciseKind(e: { type: ExerciseType; name: string; equipment?: string | null }): ExerciseKind {
  if (e.type === 'cardio') return 'cardio';
  if (/Plank|Hold|Wall Sit/i.test(e.name) || e.type === 'stretching') return 'duration';
  if (e.equipment === 'body only') return 'bodyweight_reps';
  return 'weight_reps';
}

/**
 * A library entry as something loggable. Cardio is one row of distance and minutes;
 * duration holds count seconds; everything else is three sets.
 */
export const asExercise = (e: LibraryExercise): Exercise => {
  const kind = deriveExerciseKind(e);
  if (kind === 'cardio') {
    return { key: e.id, name: e.name, sets: 1, topReps: 0, prescription: 'Distance and time', kind, detail: `Cardio · ${title(e.level)}` };
  }
  if (kind === 'duration') {
    return { key: e.id, name: e.name, sets: 3, topReps: 60, prescription: '3×30–60 s', kind, detail: `${e.muscle} · ${title(e.level)}` };
  }
  return { key: e.id, name: e.name, sets: 3, topReps: 12, prescription: '3×8–12', kind, detail: `${e.muscle} · ${title(e.level)}` };
};

export interface RoutineExerciseItem {
  key: string;
  sets: number;
  reps_low: number;
  reps_high: number;
}

const MUSCLE_TO_GROUP: Record<string, MuscleGroup> = {
  Chest: 'chest',
  Shoulders: 'shoulders',
  Triceps: 'triceps',
  Back: 'back',
  Biceps: 'biceps',
  Core: 'core',
  'Lower back': 'lowerback',
  Quads: 'quads',
  Hamstrings: 'hamstrings',
  Calves: 'calves',
};

/** Muscle groups targeted by any known exercise key. */
export function exerciseMuscles(key: string): MuscleGroup[] {
  const splitEx = SPLIT_EXERCISES_BY_KEY.get(key);
  if (splitEx) {
    const groups: MuscleGroup[] = [];
    for (const d of SPLIT) {
      if (d.exercises.some((e) => e.key === key)) {
        groups.push(...d.muscles);
      }
    }
    return [...new Set(groups)];
  }
  const lib = libraryExercise(key);
  if (lib && MUSCLE_TO_GROUP[lib.muscle]) {
    return [MUSCLE_TO_GROUP[lib.muscle]];
  }
  return [];
}

/**
 * Builds an Exercise object for a custom routine entry using split/library metadata,
 * preserving kind, photo paths, detail labels, and formatting the prescription string.
 */
export function buildCustomExercise(item: RoutineExerciseItem): Exercise {
  const kind = lookupExerciseKind(item.key);
  const name = exerciseName(item.key);
  const repsText = item.reps_low === item.reps_high ? `${item.reps_low}` : `${item.reps_low}–${item.reps_high}`;
  const prescription =
    kind === 'cardio'
      ? 'Distance and time'
      : kind === 'duration'
        ? `${item.sets}×${repsText} s`
        : `${item.sets}×${repsText}`;
  const lib = libraryExercise(item.key);
  const splitEx = SPLIT_EXERCISES_BY_KEY.get(item.key);
  const detail = lib ? `${lib.muscle} · ${title(lib.level)}` : splitEx?.detail;
  return {
    key: item.key,
    name,
    sets: item.sets,
    topReps: item.reps_high,
    prescription,
    kind,
    detail,
  };
}

/** Start and finish photos. The fixed split's photos ship with the app; library photos come from the proxy endpoint. */
export const exercisePhotos = (key: string): [start: string, finish: string] =>
  EXERCISE_KEYS.has(key) ? [`/exercises/${key}-0.jpg`, `/exercises/${key}-1.jpg`] : [`/api/exercises/${key}/0.jpg`, `/api/exercises/${key}/1.jpg`];

const INCLINE_KEYWORDS = ['treadmill', 'walking', 'running', 'hiking', 'stair', 'step', 'elliptical'];

/** True for cardio exercises that support incline / gradient. */
export const supportsIncline = (name: string): boolean => {
  const lower = name.toLowerCase();
  return INCLINE_KEYWORDS.some((kw) => lower.includes(kw));
};
