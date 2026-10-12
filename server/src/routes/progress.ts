import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  addDays, adjustmentAdvice, dayDeltaFor, streak, type MeasureDelta, type Measurements, type Profile, type ProgressResponse,
} from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { loadProfile, loadWeights, requireTargets } from './profile';

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number | null, digits = 0) => (n === null ? null : Math.round(n * 10 ** digits) / 10 ** digits);

/** A day counts as a protein hit at 90% of target, so 134 g against 135 g is not a miss. */
const PROTEIN_HIT = 0.9;

export async function buildProgress(sb: SupabaseClient, userId: string, today: string): Promise<{ profile: Profile; progress: ProgressResponse }> {
  const from14 = addDays(today, -13);
  const from7 = addDays(today, -6);
  const [profile, weights, logs, checks, sets, measurements, logDates] = await Promise.all([
    loadProfile(sb, userId),
    loadWeights(sb, today),
    sb.from('food_logs').select('log_date,kcal,protein_g').gte('log_date', from14).lte('log_date', today)
      .then(unwrap<{ log_date: string; kcal: number; protein_g: number }[]>),
    sb.from('daily_checks').select('sleep_hours,water_ml,steps').gte('log_date', from7).lte('log_date', today)
      .then(unwrap<{ sleep_hours: number | null; water_ml: number; steps?: number | null }[]>),
    sb.from('workout_sets').select('log_date').gte('log_date', from7).lte('log_date', today).gt('reps', 0)
      .then(unwrap<{ log_date: string }[]>),
    sb.from('measurements').select('log_date,waist_cm,chest_cm,arm_cm').order('log_date').then(unwrap<Measurements[]>),
    // shortcut: streaks are counted over the newest 1000 log rows (about 100 days); page this query if longer streaks matter
    sb.from('food_logs').select('log_date').lte('log_date', today).order('log_date', { ascending: false }).limit(1000)
      .then(unwrap<{ log_date: string }[]>),
  ]);

  const byDay = new Map<string, { kcal: number; protein: number }>();
  for (const log of logs) {
    const day = byDay.get(log.log_date) ?? { kcal: 0, protein: 0 };
    day.kcal += log.kcal;
    day.protein += log.protein_g;
    byDay.set(log.log_date, day);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(from14, i);
    return { date, eaten: byDay.get(date), targets: requireTargets(profile, dayDeltaFor(date, profile.program)) };
  });
  const week = days.slice(7).filter((d) => d.eaten);

  const delta = (field: 'waist_cm' | 'chest_cm' | 'arm_cm'): MeasureDelta | null => {
    const values = measurements.map((m) => m[field]).filter((v): v is number => v !== null);
    if (!values.length) return null;
    const [first, latest] = [values[0], values[values.length - 1]];
    return { first, latest, delta: round(latest - first, 1)! };
  };

  const progress: ProgressResponse = {
    weights: weights.map((w) => ({
      ...w,
      avg7: round(mean(weights.filter((o) => o.log_date > addDays(w.log_date, -7) && o.log_date <= w.log_date).map((o) => o.weight_kg)), 2)!,
    })),
    calories: days.map((d) => ({ date: d.date, kcal: Math.round(d.eaten?.kcal ?? 0), target: d.targets.kcal })),
    summary: {
      daysLogged: week.length,
      avgKcal: round(mean(week.map((d) => d.eaten!.kcal))),
      avgProtein: round(mean(week.map((d) => d.eaten!.protein))),
      proteinHitDays: week.filter((d) => d.eaten!.protein >= PROTEIN_HIT * d.targets.protein_g).length,
      workouts: new Set(sets.map((s) => s.log_date)).size,
      avgSleep: round(mean(checks.map((c) => c.sleep_hours).filter((v): v is number => v !== null)), 1),
      avgWater: round(mean(checks.map((c) => c.water_ml))),
      avgSteps: round(mean(checks.map((c) => c.steps).filter((v): v is number => typeof v === 'number' && v > 0))),
    },
    measurements: { waist_cm: delta('waist_cm'), chest_cm: delta('chest_cm'), arm_cm: delta('arm_cm') },
    streak: streak(logDates.map((l) => l.log_date), today),
    advice: adjustmentAdvice({ weights, goal: profile.goal, today, lastAdjustedOn: profile.last_adjusted_on }),
  };
  return { profile, progress };
}

export const progressRouter = Router();

progressRouter.get('/progress', h(async (req, res) => {
  res.json((await buildProgress(req.sb, req.userId, req.today)).progress);
}));
