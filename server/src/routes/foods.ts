import { Router } from 'express';
import { BarcodeParams, FoodInput, FoodQuery, IdParams, type Food } from '@fuellog/shared';
import { lookupBarcode } from '../lib/openFoodFacts';
import { h, HttpError, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';

export const foodsRouter = Router();

foodsRouter.get('/foods', validate({ query: FoodQuery }), h(async (req, res) => {
  const q = String(req.query.q).replace(/[%_\\]/g, '\\$&'); // literal match, not user-supplied wildcards
  const foods: Food[] = unwrap(await req.sb.from('foods').select('*').ilike('name', `%${q}%`).order('name').limit(20));
  res.json(foods);
}));

foodsRouter.post('/foods', validate({ body: FoodInput }), h(async (req, res) => {
  const result = await req.sb.from('foods').insert({ ...req.body, owner_id: req.userId }).select().single();
  if (result.error?.code === '23505') throw new HttpError(400, 'duplicate', 'You already have a food with that name.');
  res.status(201).json(unwrap(result));
}));

foodsRouter.delete('/foods/:id', validate({ params: IdParams }), h(async (req, res) => {
  const deleted: Food[] = unwrap(await req.sb.from('foods').delete().eq('id', req.params.id).eq('owner_id', req.userId).select());
  if (!deleted.length) throw new HttpError(404, 'not_found', 'That food is not one of your custom foods.');
  res.status(204).end();
}));

foodsRouter.get('/foods/barcode/:code', validate({ params: BarcodeParams }), h(async (req, res) => {
  const { code } = req.params;
  const cached: Food[] = unwrap(await req.sb.from('foods').select('*').eq('barcode', code).limit(1));
  if (cached.length) return res.json(cached[0]);

  const found = await lookupBarcode(code);
  if (!found) throw new HttpError(404, 'barcode_not_found', 'That barcode is not in Open Food Facts. Add it as a custom food.');

  const row = { ...found, owner_id: req.userId, barcode: code };
  let saved = await req.sb.from('foods').insert(row).select().single();
  // The user already has a different food with this name: keep both, told apart by the barcode's last digits.
  if (saved.error?.code === '23505') saved = await req.sb.from('foods').insert({ ...row, name: `${found.name} #${code.slice(-4)}` }).select().single();
  res.json(unwrap(saved));
}));
