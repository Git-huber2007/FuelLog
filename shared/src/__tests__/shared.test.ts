import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  addDays, adjustmentAdvice, asExercise, buildCustomExercise, computeTargets, DateParam, dayDeltaFor, daysBetween, defaultMeal, deriveExerciseKind, EXERCISE_KEYS, exerciseMuscle, EXERCISE_KINDS,
  exercisePhotos, LEAN_SIX_DAY_TEMPLATE, LIBRARY, libraryExercise, nudge, overloadHint, PROGRAM_KEYS, PROGRAMS, recommendedProgram, RoutineDayInput, RoutineExerciseInput, SetInput, similarExercises, SPLIT, SPLIT_EXERCISES_BY_KEY, splitFor,
  stepsKcal, streak, supportsIncline, weekdayOf, workoutKcal, type ExerciseKind, type MuscleGroup, type Weigh,
} from '../index';

const me = { sex: 'male', age: 22, height_cm: 175, weight_kg: 75, goal: 'maintain' } as const;

describe('targets', () => {
  it('gives exactly 2430 kcal for the reference profile', () => {
    expect(computeTargets(me)).toEqual({ kcal: 2430, protein_g: 135, fat_g: 68, carbs_g: 320, fibre_g: 30, water_ml: 2625 });
  });
  it('gives 2460 on a gym day and 2250 on Sunday', () => {
    expect(computeTargets(me, dayDeltaFor('2026-10-12')).kcal).toBe(2460); // Monday
    expect(computeTargets(me, dayDeltaFor('2026-10-17')).kcal).toBe(2460); // Saturday
    expect(computeTargets(me, dayDeltaFor('2026-10-11')).kcal).toBe(2250); // Sunday
  });
  it('adjusts day delta by chosen program and keeps weekly sum net zero', () => {
    const dates = ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17']; // Sun..Sat
    // six_day: Sunday rest (-180), 6 training days (+30 each)
    const sixDeltas = dates.map((d) => dayDeltaFor(d, 'six_day'));
    expect(sixDeltas).toEqual([-180, 30, 30, 30, 30, 30, 30]);
    expect(sixDeltas.reduce((a, b) => a + b, 0)).toBe(0);

    // upper_lower: 4 training days (Mon, Tue, Thu, Fri = +45), 3 rest days (Sun, Wed, Sat = -60)
    const ulDeltas = dates.map((d) => dayDeltaFor(d, 'upper_lower'));
    expect(ulDeltas).toEqual([-60, 45, 45, -60, 45, 45, -60]);
    expect(ulDeltas.reduce((a, b) => a + b, 0)).toBe(0);

    // full_body: 3 training days (Mon, Wed, Fri = +60), 4 rest days (Sun, Tue, Thu, Sat = -45)
    const fbDeltas = dates.map((d) => dayDeltaFor(d, 'full_body'));
    expect(fbDeltas).toEqual([-45, 60, -45, 60, -45, 60, -45]);
    expect(fbDeltas.reduce((a, b) => a + b, 0)).toBe(0);
  });
  it('never drops below 1500 kcal', () => {
    const small = { sex: 'female', age: 60, height_cm: 150, weight_kg: 40, goal: 'cut', kcal_adjust: -600 } as const;
    expect(computeTargets(small, -180).kcal).toBe(1500);
  });
  it('uses 2 g/kg protein on a cut and applies kcal_adjust', () => {
    expect(computeTargets({ ...me, goal: 'cut' }).protein_g).toBe(150);
    expect(computeTargets({ ...me, kcal_adjust: 150 }).kcal).toBe(2580);
  });
});

describe('dates', () => {
  it('does day arithmetic across month ends', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysBetween('2026-10-01', '2026-10-14')).toBe(13);
    expect(weekdayOf('2026-10-11')).toBe(0);
  });
  it('picks the meal slot by local time', () => {
    const at = (h: number, m = 0) => defaultMeal(new Date(2026, 0, 1, h, m));
    expect([at(10, 59), at(11), at(15, 59), at(16), at(21, 29), at(21, 30)]).toEqual(['breakfast', 'lunch', 'lunch', 'dinner', 'dinner', 'snack']);
  });
  it('validates calendar dates strictly rejecting impossible dates', () => {
    expect(DateParam.safeParse('2026-10-12').success).toBe(true);
    expect(DateParam.safeParse('2024-02-29').success).toBe(true);
    expect(DateParam.safeParse('2026-02-31').success).toBe(false);
    expect(DateParam.safeParse('2025-02-29').success).toBe(false);
    expect(DateParam.safeParse('2026-04-31').success).toBe(false);
    expect(DateParam.safeParse('not-a-date').success).toBe(false);
  });
});

describe('adaptive adjustment', () => {
  const today = '2026-10-14';
  /** 14 daily weigh-ins ending today, changing by `perDay` kg each day. */
  const series = (perDay: number, days = 14): Weigh[] =>
    Array.from({ length: days }, (_, i) => ({ log_date: addDays(today, -i), weight_kg: 75 - perDay * i }));
  const advise = (weights: Weigh[], goal: 'cut' | 'maintain' | 'gain' = 'maintain', lastAdjustedOn: string | null = null) =>
    adjustmentAdvice({ weights, goal, today, lastAdjustedOn });

  it('needs 8 weigh-ins spanning 13 days', () => {
    expect(advise(series(0, 7)).status).toBe('insufficient');
    expect(advise(series(0).slice(0, 10)).status).toBe('insufficient'); // 10 weigh-ins but only 9 days apart
    expect(advise([]).status).toBe('insufficient');
  });
  it('suggests +150 when losing too fast and -150 when gaining too fast', () => {
    expect(advise(series(-0.1))).toMatchObject({ status: 'adjust', delta: 150 }); // -0.7 kg/week on maintain
    expect(advise(series(0.1))).toMatchObject({ status: 'adjust', delta: -150 });
    expect(advise(series(0), 'gain')).toMatchObject({ status: 'adjust', delta: 150 }); // flat is below the gain band
  });
  it('says on track inside the band', () => {
    expect(advise(series(0))).toMatchObject({ status: 'on_track', delta: 0 });
    expect(advise(series(-0.07), 'cut').status).toBe('on_track'); // -0.49 kg/week
  });
  it('does not offer again within 7 days of the last adjustment', () => {
    expect(advise(series(0.1), 'maintain', addDays(today, -6)).status).toBe('cooldown');
    expect(advise(series(0.1), 'maintain', addDays(today, -7)).status).toBe('adjust');
  });
});

describe('streak', () => {
  const today = '2026-10-14';
  const back = (...offsets: number[]) => offsets.map((o) => addDays(today, -o));
  it('counts consecutive days', () => expect(streak(back(0, 1, 2), today)).toBe(3));
  it('survives one missed day', () => {
    expect(streak(back(0, 1, 3, 4), today)).toBe(4);
    expect(streak(back(1, 2), today)).toBe(2); // nothing logged yet today
  });
  it('resets after two missed days in a row', () => {
    expect(streak(back(0, 1, 4, 5), today)).toBe(2);
    expect(streak(back(2, 3), today)).toBe(0);
  });
});

describe('overload hint', () => {
  const bench = { sets: 3, topReps: 10 };
  const set = (weight_kg: number, reps: number) => ({ weight_kg, reps });
  it('fires when every prescribed set reached the top of the range', () => {
    expect(overloadHint([set(40, 10), set(40, 10), set(40, 11)], bench)).toBe(true);
  });
  it('stays quiet on a short set, a missing set or no weight', () => {
    expect(overloadHint([set(40, 10), set(40, 10), set(40, 9)], bench)).toBe(false);
    expect(overloadHint([set(40, 10), set(40, 10)], bench)).toBe(false);
    expect(overloadHint([set(0, 10), set(0, 10), set(0, 10)], bench)).toBe(false);
  });
  it('handles overloadHint per kind', () => {
    const weightedLift = { sets: 3, topReps: 10, kind: 'weight_reps' as ExerciseKind };
    expect(overloadHint([set(50, 10), set(50, 10), set(50, 10)], weightedLift)).toBe(true);
    expect(overloadHint([set(0, 10), set(0, 10), set(0, 10)], weightedLift)).toBe(false);

    const weightedDip = { sets: 3, topReps: 8, kind: 'weighted_bodyweight' as ExerciseKind };
    expect(overloadHint([set(10, 8), set(10, 8), set(10, 8)], weightedDip)).toBe(true);
    expect(overloadHint([set(0, 8), set(0, 8), set(0, 8)], weightedDip)).toBe(false);

    const pushup = { sets: 3, topReps: 15, kind: 'bodyweight_reps' as ExerciseKind };
    expect(overloadHint([set(0, 15), set(0, 15), set(0, 16)], pushup)).toBe(true);
    expect(overloadHint([set(0, 15), set(0, 15), set(0, 14)], pushup)).toBe(false);

    const assistedPullup = { sets: 3, topReps: 10, kind: 'assisted_bodyweight' as ExerciseKind };
    expect(overloadHint([set(20, 10), set(20, 10), set(20, 10)], assistedPullup)).toBe(true);
    expect(overloadHint([set(20, 10), set(20, 9), set(20, 10)], assistedPullup)).toBe(false);

    const plank = { sets: 3, topReps: 45, kind: 'duration' as ExerciseKind };
    expect(overloadHint([set(0, 45), set(0, 50), set(0, 45)], plank)).toBe(true);
    expect(overloadHint([set(0, 45), set(0, 40), set(0, 45)], plank)).toBe(false);

    const run = { sets: 1, topReps: 0, kind: 'cardio' as ExerciseKind };
    expect(overloadHint([set(5, 30)], run)).toBe(false);
  });
});

describe('nudge', () => {
  const base = {
    isToday: true, hour: 12, targets: { kcal: 2460, protein_g: 135, water_ml: 2625 },
    eaten: { kcal: 1000, protein_g: 50 }, water_ml: 2000, hasWeighIn: true,
    foods: [
      { name: 'Egg white', kcal: 17, protein_g: 4 },
      { name: 'Whey protein', kcal: 120, protein_g: 24 },
      { name: 'Chicken breast, cooked', kcal: 165, protein_g: 31 },
      { name: 'Soya chunks, dry', kcal: 170, protein_g: 26 },
      { name: 'Paneer', kcal: 265, protein_g: 18 },
    ],
  };
  it('suggests the three best protein-per-calorie foods of at least 8 g', () => {
    expect(nudge(base)).toBe('85 g protein to go. Good fits: Whey protein, Chicken breast, cooked, Soya chunks, dry');
  });
  it('only suggests foods that fit the remaining calories', () => {
    expect(nudge({ ...base, eaten: { kcal: 2320, protein_g: 50 } })).toBe('85 g protein to go. Good fits: Whey protein');
  });
  it('falls through water, weigh-in and protein reached in order', () => {
    const done = { ...base, eaten: { kcal: 2400, protein_g: 130 } };
    expect(nudge({ ...done, hour: 17, water_ml: 1000, hasWeighIn: false })).toMatch(/water/);
    expect(nudge({ ...done, hour: 15, water_ml: 1000, hasWeighIn: false })).toMatch(/weigh-in/);
    expect(nudge(done)).toBe('Protein target reached.');
    expect(nudge({ ...base, isToday: false })).toBeNull();
  });
});

describe('split', () => {
  it('trains legs on Saturday only and rests on Sunday', () => {
    const legDays = SPLIT.flatMap((d, i) => (d.muscles.includes('quads') ? [i] : []));
    expect(legDays).toEqual([6]);
    expect(splitFor('2026-10-11').exercises).toHaveLength(0);
    expect(splitFor('2026-10-17').title).toBe('Legs');
  });
  it('offers three programs built from known exercises, and recommends one per level', () => {
    for (const key of PROGRAM_KEYS) {
      expect(PROGRAMS[key].days).toHaveLength(7);
      expect(PROGRAMS[key].days.flatMap((d) => d.exercises).every((e) => e && EXERCISE_KEYS.has(e.key))).toBe(true);
    }
    expect(PROGRAMS.full_body.days.filter((d) => d.exercises.length).length).toBe(3);
    expect(PROGRAMS.upper_lower.days.filter((d) => d.exercises.length).length).toBe(4);
    expect([recommendedProgram('beginner'), recommendedProgram('intermediate'), recommendedProgram('expert')]).toEqual(['full_body', 'upper_lower', 'six_day']);
    expect(splitFor('2026-10-13', 'full_body').exercises).toHaveLength(0); // Tuesday is a rest day on three days a week
    expect(splitFor('2026-10-13').title).toBe('Pull · back width'); // the default stays the six-day plan
  });
  it('provides the Arnold 6-day split with matching daily targets and muscle focuses', () => {
    const p = PROGRAMS.arnold_six_day;
    expect(p.days).toHaveLength(7);
    expect(p.days[0].title).toBe('Rest');
    expect(p.days[1].title).toBe('Chest & Triceps');
    expect(p.days[1].muscles).toEqual(['chest', 'triceps']);
    expect(p.days[2].title).toBe('Back & Biceps');
    expect(p.days[2].muscles).toEqual(['back', 'biceps']);
    expect(p.days[3].title).toBe('Shoulder & Abs');
    expect(p.days[3].muscles).toEqual(['shoulders', 'core']);
    expect(p.days[4].title).toBe('Chest & Triceps');
    expect(p.days[4].muscles).toEqual(['chest', 'triceps']);
    expect(p.days[5].title).toBe('Back & Biceps');
    expect(p.days[5].muscles).toEqual(['back', 'biceps']);
    expect(p.days[6].title).toBe('Legs & Abs');
    expect(p.days[6].muscles).toEqual(['quads', 'hamstrings', 'calves', 'core']);

    expect(splitFor('2026-10-13', 'arnold_six_day').title).toBe('Back & Biceps');
    expect(dayDeltaFor('2026-10-13', 'arnold_six_day')).toBe(30);
    expect(splitFor('2026-10-11', 'arnold_six_day').title).toBe('Rest');
    expect(dayDeltaFor('2026-10-11', 'arnold_six_day')).toBe(-180);
  });
  it('estimates calories burned from sets, distance, time and incline', () => {
    const set = (weight_kg: number, reps: number, incline_pct: number | null = null) => ({ weight_kg, reps, incline_pct });
    expect(workoutKcal([], 70)).toBe(0);
    expect(stepsKcal(10000, 70)).toBe(399);
    expect(stepsKcal(0, 70)).toBe(0);
    expect(workoutKcal([{ logged: [set(60, 10), set(60, 0)] }], 70)).toBe(13); // one finished set; the empty one counts for nothing
    const flat = workoutKcal([{ cardio: true, logged: [set(5, 30)] }], 70); // 10 km/h for 30 minutes
    expect(flat).toBeGreaterThan(330);
    expect(flat).toBeLessThan(420);
    expect(workoutKcal([{ cardio: true, logged: [set(5, 30, 5)] }], 70)).toBeGreaterThan(flat);
    expect(workoutKcal([{ cardio: true, logged: [set(5, 30, -5)] }], 70)).toBeLessThan(flat);
    expect(workoutKcal([{ cardio: true, logged: [set(0, 20)] }], 70)).toBe(172); // minutes only
    expect(SetInput.safeParse({ exercise_key: 'Running_Treadmill', set_number: 1, weight_kg: 5, reps: 30, incline_pct: -3 }).success).toBe(true);
    expect(SetInput.safeParse({ exercise_key: 'Running_Treadmill', set_number: 1, weight_kg: 5, reps: 30, incline_pct: 60 }).success).toBe(false);
  });
  it('has stable, unique, weekday-prefixed keys', () => {
    expect(EXERCISE_KEYS.has('mon-bench-press')).toBe(true);
    expect(EXERCISE_KEYS.has('wed-ez-bar-curl')).toBe(true);
    expect(EXERCISE_KEYS.size).toBe(SPLIT.reduce((n, d) => n + d.exercises.length, 0));
  });
  it('has a start and finish photo for every exercise', () => {
    const missing = [...EXERCISE_KEYS].flatMap((key) => [0, 1].map((n) => `${key}-${n}.jpg`))
      .filter((file) => !existsSync(new URL(`../../../client/public/exercises/${file}`, import.meta.url)));
    expect(missing).toEqual([]);
  });
  it('offers a library with cardio and every level, whose ids are valid set keys', () => {
    expect(LIBRARY.length).toBeGreaterThan(800);
    expect(new Set(LIBRARY.map((e) => e.level))).toEqual(new Set(['beginner', 'intermediate', 'expert']));
    expect(LIBRARY.every((e) => e.id.length <= 60 && e.name && e.muscle)).toBe(true);
    expect(LIBRARY.some((e) => EXERCISE_KEYS.has(e.id))).toBe(false); // a clash would make a library pick look like a plan exercise
    const run = asExercise(libraryExercise('Running_Treadmill')!);
    expect(run).toMatchObject({ kind: 'cardio', sets: 1 });
    expect(SetInput.safeParse({ exercise_key: run.key, set_number: 1, weight_kg: 5, reps: 30 }).success).toBe(true);
    expect(asExercise(libraryExercise('Dumbbell_Bicep_Curl')!)).toMatchObject({ kind: 'weight_reps', sets: 3, topReps: 12, detail: 'Biceps · Beginner' });
  });
  it('derives exercise kind from a library row', () => {
    expect(deriveExerciseKind({ type: 'cardio', name: 'Running', equipment: null })).toBe('cardio');
    expect(deriveExerciseKind({ type: 'strength', name: 'Plank', equipment: 'body only' })).toBe('duration');
    expect(deriveExerciseKind({ type: 'strength', name: 'Wall Sit', equipment: 'body only' })).toBe('duration');
    expect(deriveExerciseKind({ type: 'strength', name: 'Side Plank Hold', equipment: 'body only' })).toBe('duration');
    expect(deriveExerciseKind({ type: 'stretching', name: 'Hamstring Stretch', equipment: null })).toBe('duration');
    expect(deriveExerciseKind({ type: 'strength', name: 'Push-up', equipment: 'body only' })).toBe('bodyweight_reps');
    expect(deriveExerciseKind({ type: 'strength', name: 'Bench Press', equipment: 'barbell' })).toBe('weight_reps');

    const plank = asExercise(libraryExercise('Plank')!);
    expect(plank.kind).toBe('duration');
  });
  it('tags split exercises with expected kinds while preserving keys', () => {
    expect(EXERCISE_KINDS).toEqual(['weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'duration', 'cardio']);
    expect(SPLIT_EXERCISES_BY_KEY.get('wed-plank')?.kind).toBe('duration');
    expect(SPLIT_EXERCISES_BY_KEY.get('wed-hanging-knee-raise')?.kind).toBe('bodyweight_reps');
    expect(SPLIT_EXERCISES_BY_KEY.get('fri-back-extension')?.kind).toBe('bodyweight_reps');
    expect(SPLIT_EXERCISES_BY_KEY.get('fri-assisted-pull-up-or-pulldown')?.kind).toBe('assisted_bodyweight');
    expect(SPLIT_EXERCISES_BY_KEY.get('wed-close-grip-bench-or-dips')?.kind).toBe('weight_reps');
    expect(SPLIT_EXERCISES_BY_KEY.get('mon-bench-press')?.kind).toBe('weight_reps');
  });
  it('accepts up to 3600 seconds in SetInput', () => {
    expect(SetInput.safeParse({ exercise_key: 'wed-plank', set_number: 1, weight_kg: 0, reps: 600 }).success).toBe(true);
    expect(SetInput.safeParse({ exercise_key: 'wed-plank', set_number: 1, weight_kg: 0, reps: 3600 }).success).toBe(true);
    expect(SetInput.safeParse({ exercise_key: 'wed-plank', set_number: 1, weight_kg: 0, reps: 3601 }).success).toBe(false);
  });
  it('calculates workoutKcal for bodyweight and duration sets with weight 0', () => {
    const set = (weight_kg: number, reps: number, incline_pct: number | null = null) => ({ weight_kg, reps, incline_pct });
    expect(workoutKcal([{ kind: 'bodyweight_reps', logged: [set(0, 10)] }], 70)).toBe(13);
    expect(workoutKcal([{ kind: 'duration', logged: [set(0, 45)] }], 70)).toBe(13);
    expect(workoutKcal([{ kind: 'bodyweight_reps', logged: [set(0, 0)] }], 70)).toBe(0);
  });
  it('serves plan photos from the app and library photos from the pinned CDN', () => {
    expect(exercisePhotos('mon-bench-press')[0]).toBe('/exercises/mon-bench-press-0.jpg');
    expect(exercisePhotos('Plank')[1]).toBe('/api/exercises/Plank/1.jpg');
  });
  it('rejects sets for unknown exercises', () => {
    const set = { set_number: 1, weight_kg: 40, reps: 10 };
    expect(SetInput.safeParse({ ...set, exercise_key: 'mon-bench-press' }).success).toBe(true);
    expect(SetInput.safeParse({ ...set, exercise_key: 'mon-moon-walk' }).success).toBe(false);
  });
  it('matches incline-supported cardio exercises by keywords', () => {
    // Exercises that support incline
    expect(supportsIncline('Running, Treadmill')).toBe(true);
    expect(supportsIncline('Walking, Treadmill')).toBe(true);
    expect(supportsIncline('Jogging, Treadmill')).toBe(true);
    expect(supportsIncline('Trail Running/Walking')).toBe(true);
    expect(supportsIncline('Elliptical Trainer')).toBe(true);
    expect(supportsIncline('Stairmaster')).toBe(true);
    expect(supportsIncline('Step Mill')).toBe(true);
    expect(supportsIncline('Mountain Hiking')).toBe(true);

    // Exercises that should NOT match incline
    expect(supportsIncline('Rowing, Stationary')).toBe(false);
    expect(supportsIncline('Bicycling')).toBe(false);
    expect(supportsIncline('Bicycling, Stationary')).toBe(false);
    expect(supportsIncline('Recumbent Bike')).toBe(false);
    expect(supportsIncline('Rope Jumping')).toBe(false);
    expect(supportsIncline('Skating')).toBe(false);
    expect(supportsIncline('Prowler Sprint')).toBe(false);
    expect(supportsIncline('Bench press')).toBe(false);
  });
});

describe('custom routines', () => {
  it('validates RoutineExerciseInput constraints (sets 1–10, reps 1–3600, reps_high >= reps_low, known keys)', () => {
    // Valid entry
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 3, reps_low: 8, reps_high: 12 }).success).toBe(true);
    expect(RoutineExerciseInput.safeParse({ key: 'Plank', sets: 3, reps_low: 30, reps_high: 60 }).success).toBe(true);
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 1, reps_low: 10, reps_high: 10 }).success).toBe(true);

    // Rejects unknown exercises
    expect(RoutineExerciseInput.safeParse({ key: 'unknown-exercise', sets: 3, reps_low: 8, reps_high: 12 }).success).toBe(false);

    // Rejects invalid sets
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 0, reps_low: 8, reps_high: 12 }).success).toBe(false);
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 11, reps_low: 8, reps_high: 12 }).success).toBe(false);

    // Rejects invalid reps
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 3, reps_low: 0, reps_high: 12 }).success).toBe(false);
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 3, reps_low: 8, reps_high: 3601 }).success).toBe(false);
    expect(RoutineExerciseInput.safeParse({ key: 'mon-bench-press', sets: 3, reps_low: 15, reps_high: 10 }).success).toBe(false); // reps_high < reps_low
  });

  it('validates RoutineDayInput (title <= 40, exercises <= 15)', () => {
    const validExercise = { key: 'mon-bench-press', sets: 3, reps_low: 8, reps_high: 12 };

    // Valid inputs
    expect(RoutineDayInput.safeParse({ title: 'Push Day', exercises: [validExercise] }).success).toBe(true);
    expect(RoutineDayInput.safeParse({ title: '', exercises: [] }).success).toBe(true);

    // Title length limit
    expect(RoutineDayInput.safeParse({ title: 'a'.repeat(40), exercises: [] }).success).toBe(true);
    expect(RoutineDayInput.safeParse({ title: 'a'.repeat(41), exercises: [] }).success).toBe(false);

    // Exercise count limit (max 15)
    const fifteen = Array.from({ length: 15 }, () => validExercise);
    expect(RoutineDayInput.safeParse({ title: 'Long day', exercises: fifteen }).success).toBe(true);

    const sixteen = Array.from({ length: 16 }, () => validExercise);
    expect(RoutineDayInput.safeParse({ title: 'Too many', exercises: sixteen }).success).toBe(false);
  });

  it('builds Exercise objects for custom entries with correct kind and prescription', () => {
    const bench = buildCustomExercise({ key: 'mon-bench-press', sets: 4, reps_low: 6, reps_high: 8 });
    expect(bench).toMatchObject({
      key: 'mon-bench-press',
      name: 'Bench press',
      sets: 4,
      topReps: 8,
      prescription: '4×6–8',
      kind: 'weight_reps',
    });

    const plank = buildCustomExercise({ key: 'Plank', sets: 3, reps_low: 30, reps_high: 45 });
    expect(plank).toMatchObject({
      key: 'Plank',
      sets: 3,
      topReps: 45,
      prescription: '3×30–45 s',
      kind: 'duration',
    });

    const singleRep = buildCustomExercise({ key: 'mon-bench-press', sets: 3, reps_low: 5, reps_high: 5 });
    expect(singleRep.prescription).toBe('3×5');
  });

  it('splitFor returns customDay when program is custom, defaulting to rest if null', () => {
    const customSplitDay = {
      title: 'Custom Push',
      muscles: ['chest', 'triceps'] as MuscleGroup[],
      exercises: [buildCustomExercise({ key: 'mon-bench-press', sets: 3, reps_low: 8, reps_high: 12 })],
    };

    // When custom day is provided
    const day = splitFor('2026-10-12', 'custom', customSplitDay);
    expect(day.title).toBe('Custom Push');
    expect(day.exercises).toHaveLength(1);

    // When custom day is null/omitted -> Rest day
    const rest = splitFor('2026-10-12', 'custom', null);
    expect(rest).toEqual({ title: 'Rest', muscles: [], exercises: [] });
  });

  it('similarExercises suggests same-muscle stand-ins, one per equipment, skipping excluded keys', () => {
    const forLegPress = similarExercises('sat-squat-or-leg-press', new Set());
    expect(forLegPress.map((e) => e.name)).toContain('Leg Press');
    expect(forLegPress.every((e) => e.muscle === 'Quads')).toBe(true);
    expect(new Set(forLegPress.map((e) => e.equipment)).size).toBe(forLegPress.length);

    const forPulldown = similarExercises('Wide-Grip_Lat_Pulldown', new Set(['Close-Grip_Front_Lat_Pulldown']));
    expect(forPulldown).toHaveLength(3);
    expect(forPulldown.map((e) => e.id)).not.toContain('Wide-Grip_Lat_Pulldown');
    expect(forPulldown.map((e) => e.id)).not.toContain('Close-Grip_Front_Lat_Pulldown');
    expect(forPulldown.every((e) => e.muscle === 'Back' && e.level !== 'expert')).toBe(true);

    expect(similarExercises('no-such-key', new Set())).toEqual([]);
  });

  it('lean six-day template uses only library exercises and valid routine days', () => {
    const { days } = LEAN_SIX_DAY_TEMPLATE;
    expect(days).toHaveLength(7);
    expect(days[0].exercises).toHaveLength(0);
    for (const d of days) {
      expect(RoutineDayInput.safeParse(d).success).toBe(true);
      for (const e of d.exercises) expect(libraryExercise(e.key), e.key).toBeDefined();
    }
    expect(days[6].title).toBe('Legs');
    expect(buildCustomExercise(days[3].exercises[4]).prescription).toBe('3×30–60 s');
  });
});


describe('exerciseMuscle', () => {
  it('maps every program exercise and library muscles to a muscle group', () => {
    for (const key of EXERCISE_KEYS) expect(exerciseMuscle(key), key).not.toBeNull();
    expect(exerciseMuscle('Ab_Roller')).toBe('core');
    expect(exerciseMuscle('nope')).toBeNull();
  });
});
