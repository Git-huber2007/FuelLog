import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  addDays, adjustmentAdvice, asExercise, computeTargets, DateParam, dayDeltaFor, daysBetween, defaultMeal, EXERCISE_KEYS, exercisePhotos, LIBRARY, libraryExercise, nudge,
  overloadHint, PROGRAM_KEYS, PROGRAMS, recommendedProgram, SetInput, SPLIT, splitFor, stepsKcal, streak, supportsIncline, weekdayOf, workoutKcal, type Weigh,
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
    expect(run).toMatchObject({ cardio: true, sets: 1 });
    expect(SetInput.safeParse({ exercise_key: run.key, set_number: 1, weight_kg: 5, reps: 30 }).success).toBe(true);
    expect(asExercise(libraryExercise('Dumbbell_Bicep_Curl')!)).toMatchObject({ sets: 3, topReps: 12, detail: 'Biceps · Beginner' });
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
