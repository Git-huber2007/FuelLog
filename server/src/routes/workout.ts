import { Router } from 'express';
import {
  asExercise, buildCustomExercise, DateParams, exerciseMuscles, isNewPR, libraryExercise, overloadHint, PROGRAMS, splitFor, weekdayOf,
  type Exercise, type RoutineDayRow, type SplitDay, type WorkoutResponse, type WorkoutSet,
} from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';
import { loadProfile } from './profile';

export const workoutRouter = Router();
const COLUMNS = 'log_date,exercise_key,set_number,weight_kg,reps,incline_pct';

workoutRouter.get('/workout/:date', validate({ params: DateParams }), h(async (req, res) => {
  const { date } = req.params;
  const [profile, today, customRow, check] = await Promise.all([
    loadProfile(req.sb, req.userId),
    req.sb.from('workout_sets').select(COLUMNS).eq('log_date', date).order('set_number').then(unwrap<WorkoutSet[]>),
    req.sb.from('routine_days').select('weekday,title,exercises').eq('weekday', weekdayOf(date)).maybeSingle().then(unwrap<RoutineDayRow | null>),
    // '*' so the workout still loads on a database where the skipped-exercises migration has not been run yet.
    req.sb.from('daily_checks').select('*').eq('log_date', date).maybeSingle().then(unwrap<{ skipped_exercises?: string[] } | null>),
  ]);
  const skippedKeys = new Set(check?.skipped_exercises ?? []);

  let customPlan: SplitDay | null = null;
  if (profile.program === 'custom' && customRow && customRow.exercises.length > 0) {
    const customExercises = customRow.exercises.map(buildCustomExercise);
    const customMuscles = [...new Set(customRow.exercises.flatMap((e) => exerciseMuscles(e.key)))];
    customPlan = {
      title: customRow.title || 'Custom workout',
      muscles: customMuscles,
      exercises: customExercises,
    };
  }

  const plan = splitFor(date, profile.program, customPlan);
  const planKeys = new Set(plan.exercises.map((e) => e.key));

  // An exercise the user added from the library is on this day because it has a set row here, even an empty one.
  const extras = [...new Set(today.map((s) => s.exercise_key))]
    .filter((key) => !planKeys.has(key))
    .flatMap((key) => libraryExercise(key) ?? [])
    .map(asExercise)
    .sort((a, b) => a.name.localeCompare(b.name));
  const exercises: (Exercise & { extra: boolean })[] = [
    ...plan.exercises.filter((e) => !skippedKeys.has(e.key)).map((e) => ({ ...e, extra: false })),
    ...extras.map((e) => ({ ...e, extra: true })),
  ];

  // An exercise recurs about weekly at up to 25 sets a session, so 500 rows reaches back months.
  const earlier = exercises.length
    ? await req.sb.from('workout_sets').select(COLUMNS).in('exercise_key', exercises.map((e) => e.key)).lt('log_date', date)
      .order('log_date', { ascending: false }).order('set_number').limit(500).then(unwrap<WorkoutSet[]>)
    : [];
  const done = earlier.filter((s) => s.reps > 0);

  const body: WorkoutResponse = {
    date,
    title: plan.title,
    muscles: plan.muscles,
    skipped: plan.exercises.filter((e) => skippedKeys.has(e.key)).map(({ key, name }) => ({ key, name })),
    program: profile.program,
    programName: PROGRAMS[profile.program].name,
    exercises: exercises.map((exercise) => {
      const mine = done.filter((s) => s.exercise_key === exercise.key);
      const lastSets = mine.filter((s) => s.log_date === mine[0].log_date);
      const logged = today
        .filter((s) => s.exercise_key === exercise.key)
        .map((s) => ({
          ...s,
          is_pr: isNewPR(s, mine, exercise.kind, exercise.topReps, profile.weight_kg ?? 70),
        }));
      return {
        ...exercise,
        logged,
        last: lastSets.length ? { date: lastSets[0].log_date, sets: lastSets } : null,
        overload: overloadHint(lastSets, exercise),
      };
    }),
  };
  res.json(body);
}));
