import { Router } from 'express';
import {
  addDays, AddFoodBody, CheckInput, DateParams, dayDeltaFor, ExerciseParams, IdParams, MeasureInput, SetInput, WeightInput,
  type DayResponse, type FoodLog, type LogSource, type RecentFood,
} from '@fuellog/shared';
import { h, HttpError, unwrap } from '../middleware/errors';
import { notFuture, validate } from '../middleware/validate';
import { loadProfile, requireTargets } from './profile';

export const daysRouter = Router();
const date = validate({ params: DateParams });

daysRouter.get('/days/:date', date, h(async (req, res) => {
  const { sb } = req;
  const d = req.params.date;
  const [logs, check, weight, measurements, sets, profile, proteinFoods] = await Promise.all([
    sb.from('food_logs').select('*').eq('log_date', d).order('created_at'),
    sb.from('daily_checks').select('water_ml,sleep_hours,creatine,protein_shake').eq('log_date', d).maybeSingle(),
    sb.from('weight_logs').select('weight_kg').eq('log_date', d).maybeSingle(),
    sb.from('measurements').select('log_date,waist_cm,chest_cm,arm_cm').eq('log_date', d).maybeSingle(),
    sb.from('workout_sets').select('log_date,exercise_key,set_number,weight_kg,reps').eq('log_date', d),
    loadProfile(sb, req.userId),
    sb.from('foods').select('name,kcal,protein_g').gte('protein_g', 8).gt('kcal', 0).limit(200),
  ]);
  const body: DayResponse = {
    date: d,
    logs: unwrap(logs),
    check: unwrap(check),
    weight_kg: unwrap(weight)?.weight_kg ?? null,
    measurements: unwrap(measurements),
    sets: unwrap(sets),
    targets: requireTargets(profile, dayDeltaFor(d)),
    proteinFoods: unwrap(proteinFoods),
  };
  res.json(body);
}));

daysRouter.post('/days/:date/food', date, validate({ body: AddFoodBody }), notFuture, h(async (req, res) => {
  const rows = (req.body as AddFoodBody).entries.map((e) => ({ ...e, user_id: req.userId, log_date: req.params.date }));
  res.status(201).json(unwrap(await req.sb.from('food_logs').insert(rows).select()));
}));

daysRouter.delete('/food-logs/:id', validate({ params: IdParams }), h(async (req, res) => {
  const deleted: FoodLog[] = unwrap(await req.sb.from('food_logs').delete().eq('id', req.params.id).select());
  if (!deleted.length) throw new HttpError(404, 'not_found', 'That entry no longer exists.');
  res.status(204).end();
}));

daysRouter.post('/days/:date/copy-previous', date, notFuture, h(async (req, res) => {
  const existing: Array<{ id: string }> = unwrap(await req.sb.from('food_logs').select('id').eq('log_date', req.params.date).limit(1));
  if (existing.length) throw new HttpError(400, 'already_logged', 'This day already has food logged.');
  const previous: FoodLog[] = unwrap(await req.sb.from('food_logs').select('*').eq('log_date', addDays(req.params.date, -1)).order('created_at'));
  if (!previous.length) throw new HttpError(404, 'nothing_to_copy', 'Nothing was logged the day before.');
  const rows = previous.map(({ meal, food_id, name, servings, kcal, protein_g, carbs_g, fat_g, fibre_g, source }) => ({
    meal, food_id, name, servings, kcal, protein_g, carbs_g, fat_g, fibre_g, source, user_id: req.userId, log_date: req.params.date,
  }));
  res.status(201).json(unwrap(await req.sb.from('food_logs').insert(rows).select()));
}));

daysRouter.put('/days/:date/check', date, validate({ body: CheckInput }), notFuture, h(async (req, res) => {
  const row = { ...req.body, user_id: req.userId, log_date: req.params.date };
  res.json(unwrap(await req.sb.from('daily_checks').upsert(row).select('water_ml,sleep_hours,creatine,protein_shake').single()));
}));

daysRouter.put('/days/:date/weight', date, validate({ body: WeightInput }), notFuture, h(async (req, res) => {
  const { weight_kg } = req.body;
  unwrap(await req.sb.from('weight_logs').upsert({ user_id: req.userId, log_date: req.params.date, weight_kg }));
  if (req.params.date === req.today) unwrap(await req.sb.from('profiles').update({ weight_kg }).eq('id', req.userId));
  res.json({ weight_kg });
}));

daysRouter.put('/days/:date/measurements', date, validate({ body: MeasureInput }), notFuture, h(async (req, res) => {
  const row = { ...req.body, user_id: req.userId, log_date: req.params.date };
  res.json(unwrap(await req.sb.from('measurements').upsert(row).select('log_date,waist_cm,chest_cm,arm_cm').single()));
}));

daysRouter.put('/days/:date/sets', date, validate({ body: SetInput }), notFuture, h(async (req, res) => {
  const row = { ...req.body, user_id: req.userId, log_date: req.params.date };
  res.json(unwrap(await req.sb.from('workout_sets').upsert(row).select('log_date,exercise_key,set_number,weight_kg,reps').single()));
}));

// Takes an exercise off a day by removing its sets. Adding one is a PUT of an empty first set.
daysRouter.delete('/days/:date/exercises/:key', validate({ params: ExerciseParams }), notFuture, h(async (req, res) => {
  unwrap(await req.sb.from('workout_sets').delete().eq('log_date', req.params.date).eq('exercise_key', req.params.key));
  res.status(204).end();
}));

const AI_SOURCES: LogSource[] = ['ai_text', 'ai_photo'];

daysRouter.get('/recent-foods', h(async (req, res) => {
  const logs: FoodLog[] = unwrap(
    await req.sb.from('food_logs').select('*').not('source', 'in', `(${AI_SOURCES.join(',')})`).order('created_at', { ascending: false }).limit(100),
  );
  const seen = new Set<string>();
  const recent: RecentFood[] = [];
  for (const log of logs) {
    const key = log.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const per = (n: number) => Math.round((n / log.servings) * 10) / 10; // back to one serving
    recent.push({
      food_id: log.food_id, name: log.name, source: log.source,
      kcal: per(log.kcal), protein_g: per(log.protein_g), carbs_g: per(log.carbs_g), fat_g: per(log.fat_g), fibre_g: per(log.fibre_g),
    });
    if (recent.length === 6) break;
  }
  res.json(recent);
}));
