import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  addDays, AiItems, CoachResult, exerciseName, ParsePhotoBody, ParseTextBody, type AiParseResponse, type FoodLog, type Meal,
} from '@fuellog/shared';
import { assertAiQuota, checkAiQuota, recordAiUse } from '../lib/aiUsage';
import { aiEnabled, generateJson } from '../lib/gemini';
import { h, HttpError, unwrap } from '../middleware/errors';
import { notFuture, validate } from '../middleware/validate';
import { PARSE_PHOTO_PROMPT } from '../prompts/parsePhoto';
import { parseTextPrompt } from '../prompts/parseText';
import { ITEMS_SCHEMA, SYSTEM_PROMPT } from '../prompts/system';
import { COACH_SCHEMA, weeklyCoachPrompt } from '../prompts/weeklyCoach';
import { buildProgress } from './progress';
import { targetsOf } from './profile';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const clamp = (v: unknown, max: number) => Math.min(max, Math.max(0, Number(v) || 0));
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : v);
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
type Loose = Record<string, unknown> | null | undefined;

/** Out-of-range numbers and over-long text from the model are pulled into the schema's ranges instead of failing. */
const ClampedItems = z.preprocess((raw) => {
  const r = raw as Loose;
  return {
    note: text(r?.note, 300),
    items: list(r?.items, 12).map((item) => {
      const i = item as Loose;
      return {
        name: text(i?.name, 80), confidence: i?.confidence,
        kcal: clamp(i?.kcal, 5000), protein_g: clamp(i?.protein_g, 400), carbs_g: clamp(i?.carbs_g, 800),
        fat_g: clamp(i?.fat_g, 400), fibre_g: clamp(i?.fibre_g, 150),
      };
    }),
  };
}, AiItems);

const ClampedCoach = z.preprocess((raw) => {
  const r = raw as Loose;
  return {
    headline: text(r?.headline, 200),
    wins: list(r?.wins, 3).map((w) => text(w, 200)),
    improve: list(r?.improve, 3).map((p) => ({ issue: text((p as Loose)?.issue, 200), action: text((p as Loose)?.action, 200) })),
    next_week_focus: text(r?.next_week_focus, 200),
  };
}, CoachResult);

async function logEstimates(req: Request, items: AiItems['items'], meal: Meal, date: string, source: 'ai_text' | 'ai_photo'): Promise<FoodLog[]> {
  if (!items.length) return [];
  const rows = items.map(({ name, kcal, protein_g, carbs_g, fat_g, fibre_g }) => ({
    name: `${name} (estimate)`, kcal, protein_g, carbs_g, fat_g, fibre_g, meal, source, servings: 1, user_id: req.userId, log_date: date,
  }));
  return unwrap(await req.sb.from('food_logs').insert(rows).select());
}

export const aiRouter = Router();

aiRouter.use('/ai', (_req, _res, next) => {
  if (!aiEnabled()) return next(new HttpError(503, 'ai_not_configured', 'AI features are switched off on this server. Everything else works as normal.'));
  next();
});

aiRouter.post('/ai/parse-text', validate({ body: ParseTextBody }), notFuture, h(async (req, res) => {
  const { text: mealText, date, meal } = req.body;
  await checkAiQuota(req.sb);
  await recordAiUse(req.sb, req.userId, 'parse_text');
  await assertAiQuota(req.sb);
  const result = await generateJson({ system: SYSTEM_PROMPT, parts: [{ text: parseTextPrompt(mealText) }], responseSchema: ITEMS_SCHEMA, validate: ClampedItems });
  const body: AiParseResponse = { entries: await logEstimates(req, result.items, meal, date, 'ai_text'), note: result.note };
  res.json(body);
}));

aiRouter.post('/ai/parse-photo', validate({ body: ParsePhotoBody }), notFuture, h(async (req, res) => {
  const { imageBase64, mimeType, date, meal } = req.body;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) throw new HttpError(400, 'validation', 'That photo could not be read. Try taking it again.');
  if ((imageBase64.length * 3) / 4 > MAX_PHOTO_BYTES) throw new HttpError(400, 'too_large', 'That photo is over 4 MB. Try a smaller one.');
  await checkAiQuota(req.sb);
  await recordAiUse(req.sb, req.userId, 'parse_photo');
  await assertAiQuota(req.sb);
  const result = await generateJson({
    system: SYSTEM_PROMPT,
    parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: PARSE_PHOTO_PROMPT }],
    responseSchema: ITEMS_SCHEMA,
    validate: ClampedItems,
  });
  const body: AiParseResponse = { entries: await logEstimates(req, result.items, meal, date, 'ai_photo'), note: result.note };
  res.json(body);
}));

type SetRow = { log_date: string; exercise_key: string; weight_kg: number; reps: number };

/** Compares each exercise trained this week with its session before that: heavier, or the same weight for more reps, is progress. */
function exerciseTrends(sets: SetRow[], weekStart: string) {
  const sessions = new Map<string, Map<string, { top: number; reps: number }>>();
  for (const s of sets) {
    const byDate = sessions.get(s.exercise_key) ?? new Map<string, { top: number; reps: number }>();
    const session = byDate.get(s.log_date) ?? { top: 0, reps: 0 };
    byDate.set(s.log_date, { top: Math.max(session.top, s.weight_kg), reps: session.reps + s.reps });
    sessions.set(s.exercise_key, byDate);
  }
  const progressed: string[] = [];
  const stalled: string[] = [];
  for (const [key, byDate] of sessions) {
    const [latestDate, previousDate] = [...byDate.keys()].sort().reverse();
    if (!previousDate || latestDate < weekStart) continue;
    const latest = byDate.get(latestDate)!;
    const previous = byDate.get(previousDate)!;
    const better = latest.top > previous.top || (latest.top === previous.top && latest.reps > previous.reps);
    (better ? progressed : stalled).push(exerciseName(key));
  }
  return { progressed, stalled };
}

aiRouter.post('/ai/weekly-coach', h(async (req, res) => {
  await checkAiQuota(req.sb);
  await recordAiUse(req.sb, req.userId, 'weekly_coach');
  await assertAiQuota(req.sb);
  const weekStart = addDays(req.today, -6);
  const [{ profile, progress }, sets] = await Promise.all([
    buildProgress(req.sb, req.userId, req.today),
    req.sb.from('workout_sets').select('log_date,exercise_key,weight_kg,reps').gte('log_date', addDays(req.today, -60)).lte('log_date', req.today)
      .gt('reps', 0).limit(1000).then(unwrap<SetRow[]>),
  ]);
  const { summary, advice } = progress;
  const trends = exerciseTrends(sets, weekStart);
  const data = {
    goal: profile.goal,
    weight_kg: profile.weight_kg,
    base_targets: targetsOf(profile),
    days_logged: summary.daysLogged,
    avg_kcal: summary.avgKcal,
    avg_protein_g: summary.avgProtein,
    protein_hit_days: summary.proteinHitDays,
    workouts_logged: summary.workouts,
    avg_sleep_hours: summary.avgSleep,
    avg_water_ml: summary.avgWater,
    avg_steps: summary.avgSteps,
    weight_change_7d_kg: advice.rate === null ? null : Math.round(advice.rate * 100) / 100,
    adjustment_advice: advice.message,
    exercises_with_progress: trends.progressed,
    exercises_stalled: trends.stalled,
  };
  const result = await generateJson({ system: SYSTEM_PROMPT, parts: [{ text: weeklyCoachPrompt(data) }], responseSchema: COACH_SCHEMA, validate: ClampedCoach });
  res.json(result);
}));
