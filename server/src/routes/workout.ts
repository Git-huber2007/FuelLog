import { Router } from 'express';
import {
  asExercise, buildCustomExercise, DateParams, exerciseMuscles, isNewPR, libraryExercise, libraryMatch, overloadHint, PROGRAMS, splitFor, weekdayOf,
  type Exercise, type RoutineDayRow, type SplitDay, type WorkoutResponse, type WorkoutSet,
} from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';
import { loadProfile } from './profile';
import instructionsJson from '../data/exerciseInstructions.json';

const INSTRUCTIONS: Record<string, string[]> = instructionsJson;

export const workoutRouter = Router();
const COLUMNS = 'log_date,exercise_key,set_number,weight_kg,reps,incline_pct';

workoutRouter.get('/workout/:date', validate({ params: DateParams }), h(async (req, res) => {
  const { date } = req.params;
  const [profile, today, routineRows, check] = await Promise.all([
    loadProfile(req.sb, req.userId),
    req.sb.from('workout_sets').select(COLUMNS).eq('log_date', date).order('set_number').then(unwrap<WorkoutSet[]>),
    // Every weekday, not just this one: the day may be running another weekday's plan, and the swap list needs their titles.
    req.sb.from('routine_days').select('weekday,title,exercises').then(unwrap<RoutineDayRow[]>),
    // '*' so the workout still loads on a database where the skipped-exercises or plan-weekday migration has not been run yet.
    req.sb.from('daily_checks').select('*').eq('log_date', date).maybeSingle().then(unwrap<{ skipped_exercises?: string[]; plan_weekday?: number | null } | null>),
  ]);
  const skippedKeys = new Set(check?.skipped_exercises ?? []);
  const scheduled = weekdayOf(date);
  const planWeekday = check?.plan_weekday ?? scheduled;
  const customRow = routineRows.find((r) => r.weekday === planWeekday) ?? null;

  // A day the plan can be swapped to; null for a rest day, which is never offered.
  const dayTitle = (weekday: number): string | null => {
    if (profile.program !== 'custom') {
      const d = PROGRAMS[profile.program].days[weekday];
      return d.exercises.length ? d.title : null;
    }
    const row = routineRows.find((r) => r.weekday === weekday);
    return row?.exercises.length ? row.title || 'Custom workout' : null;
  };
  const dayOptions = [{ weekday: scheduled, title: dayTitle(scheduled) ?? 'Rest' }];
  for (let weekday = 0; weekday < 7; weekday++) {
    const title = weekday === scheduled ? null : dayTitle(weekday);
    if (title) dayOptions.push({ weekday, title });
  }

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

  const plan = splitFor(date, profile.program, customPlan, planWeekday);
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
    ? await req.sb.from('workout_sets').select(COLUMNS).in('exercise_key', exercises.map((e) => e.key)).lt('log_date', date).gt('reps', 0)
      .order('log_date', { ascending: false }).order('set_number').limit(500).then(unwrap<WorkoutSet[]>)
    : [];
  const done = earlier;

  const body: WorkoutResponse = {
    date,
    title: plan.title,
    muscles: plan.muscles,
    skipped: plan.exercises.filter((e) => skippedKeys.has(e.key)).map(({ key, name }) => ({ key, name })),
    program: profile.program,
    programName: PROGRAMS[profile.program].name,
    planWeekday,
    dayOptions,
    exercises: exercises.map((exercise) => {
      const mine = done.filter((s) => s.exercise_key === exercise.key);
      const lastSets = mine.filter((s) => s.log_date === mine[0].log_date);
      const logged = today
        .filter((s) => s.exercise_key === exercise.key)
        .map((s) => ({
          ...s,
          is_pr: isNewPR(s, mine, exercise.kind, exercise.topReps, profile.weight_kg ?? 70),
        }));
      const maxSetNumber = logged.reduce((max, s) => Math.max(max, s.set_number), 0);
      return {
        ...exercise,
        sets: Math.max(exercise.sets, maxSetNumber),
        logged,
        last: lastSets.length ? { date: lastSets[0].log_date, sets: lastSets } : null,
        overload: overloadHint(lastSets, exercise),
        instructions: INSTRUCTIONS[libraryMatch(exercise.key)?.id ?? ''] ?? [],
      };
    }),
  };
  res.json(body);
}));
