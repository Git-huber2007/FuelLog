// The optional exercise library: about 870 public-domain exercises from free-exercise-db that a user can add to any day.
import rows from './exerciseLibrary.json';
import { EXERCISE_KEYS, EXERCISE_NAMES, type Exercise } from './split';

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
}

export const LIBRARY: readonly LibraryExercise[] = (rows as [string, string, Level, ExerciseType, string][]).map(
  ([id, name, level, type, muscle]) => ({ id, name, level, type, muscle }),
);
export const LIBRARY_MUSCLES: readonly string[] = [...new Set(LIBRARY.map((e) => e.muscle))].sort();

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));

export const libraryExercise = (key: string) => BY_ID.get(key);
export const isKnownExercise = (key: string) => EXERCISE_KEYS.has(key) || BY_ID.has(key);
export const exerciseName = (key: string) => EXERCISE_NAMES.get(key) ?? BY_ID.get(key)?.name ?? key;

const title = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * A library entry as something loggable. Cardio is one row of distance and minutes; everything else is three sets.
 * shortcut: cardio reuses the set columns (weight_kg holds km, reps holds minutes), so no migration is needed;
 * give cardio its own table if pace, heart rate or sessions over 200 minutes ever matter.
 */
export const asExercise = (e: LibraryExercise): Exercise =>
  e.type === 'cardio'
    ? { key: e.id, name: e.name, sets: 1, topReps: 0, prescription: 'Distance and time', cardio: true, detail: `Cardio · ${title(e.level)}` }
    : { key: e.id, name: e.name, sets: 3, topReps: 12, prescription: '3×8–12', detail: `${e.muscle} · ${title(e.level)}` };

// Pinned to one commit so a photo can never change or vanish under a deployed app.
const PHOTO_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises';

/** Start and finish photos. The fixed split's photos ship with the app; library photos come from the proxy endpoint. */
export const exercisePhotos = (key: string): [start: string, finish: string] =>
  EXERCISE_KEYS.has(key) ? [`/exercises/${key}-0.jpg`, `/exercises/${key}-1.jpg`] : [`/api/exercises/${key}/0.jpg`, `/api/exercises/${key}/1.jpg`];

const INCLINE_KEYWORDS = ['treadmill', 'walking', 'running', 'hiking', 'stair', 'step', 'elliptical'];

/** True for cardio exercises that support incline / gradient. */
export const supportsIncline = (name: string): boolean => {
  const lower = name.toLowerCase();
  return INCLINE_KEYWORDS.some((kw) => lower.includes(kw));
};
