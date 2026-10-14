import { Router } from 'express';
import {
  bestSet,
  calculateKindMetric,
  exerciseName,
  ExerciseKeyParam,
  formatPreviousHint,
  isNewPR,
  lookupExerciseKind,
  sessionVolume,
  type ExerciseHistoryPoint,
  type ExerciseHistoryResponse,
  type ExercisePRMilestone,
  type ExerciseSessionHistory,
  type WorkoutSet,
} from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';
import { loadProfile } from './profile';

export const exercisesRouter = Router();

exercisesRouter.get('/exercises/:key/history', validate({ params: ExerciseKeyParam }), h(async (req, res) => {
  const { key } = req.params;
  const [profile, rows] = await Promise.all([
    loadProfile(req.sb, req.userId),
    req.sb
      .from('workout_sets')
      .select('log_date,exercise_key,set_number,weight_kg,reps,incline_pct')
      .eq('exercise_key', key)
      .gt('reps', 0)
      .order('log_date', { ascending: true })
      .order('set_number', { ascending: true })
      .then(unwrap<WorkoutSet[]>),
  ]);

  const kind = lookupExerciseKind(key);
  const name = exerciseName(key);
  const bodyweightKg = profile.weight_kg ?? 70;

  let metricName = 'Estimated 1RM';
  let metricUnit = 'kg';
  if (kind === 'bodyweight_reps') {
    metricName = 'Max Reps';
    metricUnit = 'reps';
  } else if (kind === 'duration') {
    metricName = 'Hold Time';
    metricUnit = 's';
  } else if (kind === 'assisted_bodyweight') {
    metricName = 'Assistance Load';
    metricUnit = 'kg';
  } else if (kind === 'cardio') {
    metricName = 'Distance';
    metricUnit = 'km';
  }

  // Group by session date
  const byDate = new Map<string, WorkoutSet[]>();
  for (const row of rows) {
    const list = byDate.get(row.log_date) ?? [];
    list.push(row);
    byDate.set(row.log_date, list);
  }

  const chartPoints: ExerciseHistoryPoint[] = [];
  const allSessions: ExerciseSessionHistory[] = [];

  for (const [date, sets] of byDate.entries()) {
    const best = bestSet(sets, kind, bodyweightKg, 8);
    const metricVal = best ? Math.abs(calculateKindMetric(best, kind, bodyweightKg)) : 0;
    const formatted = best ? formatPreviousHint(best, kind) : '—';
    const volumeKg = sessionVolume(sets);

    chartPoints.push({
      date,
      metric: metricVal,
      formatted,
    });

    allSessions.push({
      date,
      sets,
      bestMetric: metricVal,
      volumeKg,
    });
  }

  // PR Milestones: chronological tracking of sets that established or beat records
  const prs: ExercisePRMilestone[] = [];
  const pastSetsAcc: WorkoutSet[] = [];

  for (const set of rows) {
    if (pastSetsAcc.length === 0) {
      // First session set establishes the initial baseline milestone
      prs.push({
        date: set.log_date,
        value: Math.abs(calculateKindMetric(set, kind, bodyweightKg)),
        formatted: formatPreviousHint(set, kind),
      });
    } else if (isNewPR(set, pastSetsAcc, kind, 8, bodyweightKg)) {
      prs.push({
        date: set.log_date,
        value: Math.abs(calculateKindMetric(set, kind, bodyweightKg)),
        formatted: formatPreviousHint(set, kind),
      });
    }
    pastSetsAcc.push(set);
  }

  // Take the last 10 sessions, latest first
  const recentSessions = allSessions.slice(-10).reverse();

  const response: ExerciseHistoryResponse = {
    key,
    name,
    kind,
    metricName,
    metricUnit,
    chartPoints,
    prs: prs.slice(-10).reverse(), // Most recent PRs first
    recentSessions,
  };

  res.json(response);
}));
