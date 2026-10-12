import { Router } from 'express';
import { IdParams, LogSavedMealBody, SavedMealBody, type FoodLog, type SavedMeal } from '@fuellog/shared';
import { h, HttpError, unwrap } from '../middleware/errors';
import { notFuture, validate } from '../middleware/validate';

export const savedMealsRouter = Router();

savedMealsRouter.get('/saved-meals', h(async (req, res) => {
  res.json(unwrap(await req.sb.from('saved_meals').select('id,name,items').order('created_at', { ascending: false })));
}));

savedMealsRouter.post('/saved-meals', validate({ body: SavedMealBody }), h(async (req, res) => {
  const { name, date } = req.body;
  const logs: FoodLog[] = unwrap(await req.sb.from('food_logs').select('*').eq('log_date', date).order('created_at'));
  if (!logs.length) throw new HttpError(400, 'nothing_to_save', 'Log some food on this day before saving it as a meal.');
  const items = logs.map(({ name, kcal, protein_g, carbs_g, fat_g, fibre_g }) => ({ name, kcal, protein_g, carbs_g, fat_g, fibre_g }));
  res.status(201).json(unwrap(await req.sb.from('saved_meals').insert({ user_id: req.userId, name, items }).select('id,name,items').single()));
}));

savedMealsRouter.post('/saved-meals/:id/log', validate({ params: IdParams, body: LogSavedMealBody }), notFuture, h(async (req, res) => {
  const { date, meal } = req.body;
  const saved: SavedMeal = unwrap(await req.sb.from('saved_meals').select('id,name,items').eq('id', req.params.id).single());
  const rows = saved.items.map((item) => ({ ...item, meal, servings: 1, source: 'saved_meal', user_id: req.userId, log_date: date }));
  res.status(201).json(unwrap(await req.sb.from('food_logs').insert(rows).select()));
}));

savedMealsRouter.delete('/saved-meals/:id', validate({ params: IdParams }), h(async (req, res) => {
  const deleted: SavedMeal[] = unwrap(await req.sb.from('saved_meals').delete().eq('id', req.params.id).select('id'));
  if (!deleted.length) throw new HttpError(404, 'not_found', 'That saved meal no longer exists.');
  res.status(204).end();
}));
