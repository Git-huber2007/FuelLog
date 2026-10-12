import { Router } from 'express';
import { asExercise, DateParams, libraryExercise, overloadHint, splitFor, type Exercise, type WorkoutResponse, type WorkoutSet } from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';

export const workoutRouter = Router();
const COLUMNS = 'log_date,exercise_key,set_number,weight_kg,reps';

workoutRouter.get('/workout/:date', validate({ params: DateParams }), h(async (req, res) => {
  const { date } = req.params;
  const plan = splitFor(date);
  const planKeys = new Set(plan.exercises.map((e) => e.key));
  const today = await req.sb.from('workout_sets').select(COLUMNS).eq('log_date', date).order('set_number').then(unwrap<WorkoutSet[]>);

  // An exercise the user added from the library is on this day because it has a set row here, even an empty one.
  const extras = [...new Set(today.map((s) => s.exercise_key))]
    .filter((key) => !planKeys.has(key))
    .flatMap((key) => libraryExercise(key) ?? [])
    .map(asExercise)
    .sort((a, b) => a.name.localeCompare(b.name));
  const exercises: (Exercise & { extra: boolean })[] = [
    ...plan.exercises.map((e) => ({ ...e, extra: false })),
    ...extras.map((e) => ({ ...e, extra: true })),
  ];

  // An exercise recurs about weekly at up to 25 sets a session, so 500 rows reaches back months.
  const earlier = exercises.length
    ? await req.sb.from('workout_sets').select(COLUMNS).in('exercise_key', exercises.map((e) => e.key)).lt('log_date', date)
      .order('log_date', { ascending: false }).order('set_number').limit(500).then(unwrap<WorkoutSet[]>)
    : [];
  const done = earlier.filter((s) => s.weight_kg > 0 || s.reps > 0);

  const body: WorkoutResponse = {
    date,
    title: plan.title,
    muscles: plan.muscles,
    exercises: exercises.map((exercise) => {
      const mine = done.filter((s) => s.exercise_key === exercise.key);
      const lastSets = mine.filter((s) => s.log_date === mine[0].log_date);
      return {
        ...exercise,
        logged: today.filter((s) => s.exercise_key === exercise.key),
        last: lastSets.length ? { date: lastSets[0].log_date, sets: lastSets } : null,
        overload: !exercise.cardio && overloadHint(lastSets, exercise),
      };
    }),
  };
  res.json(body);
}));
