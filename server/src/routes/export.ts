import { Router } from 'express';
import { h, unwrap } from '../middleware/errors';

const PAGE = 1000; // Supabase returns at most 1000 rows per request

async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const batch = unwrap(await page(from, from + PAGE - 1));
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}

type Day = { kcal: number; protein: number; carbs: number; fat: number; fibre: number; water?: number; sleep?: number | null; steps?: number; weight?: number };

export const exportRouter = Router();

exportRouter.get('/export.csv', h(async (req, res) => {
  const { sb } = req;
  const [logs, checks, weights] = await Promise.all([
    all<{ log_date: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }>((from, to) =>
      sb.from('food_logs').select('log_date,kcal,protein_g,carbs_g,fat_g,fibre_g').order('log_date').order('id').range(from, to)),
    all<{ log_date: string; water_ml: number; sleep_hours: number | null; steps?: number }>((from, to) =>
      sb.from('daily_checks').select('log_date,water_ml,sleep_hours,steps').order('log_date').range(from, to)),
    all<{ log_date: string; weight_kg: number }>((from, to) => sb.from('weight_logs').select('log_date,weight_kg').order('log_date').range(from, to)),
  ]);

  const days = new Map<string, Day>();
  const day = (date: string) => {
    if (!days.has(date)) days.set(date, { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
    return days.get(date)!;
  };
  for (const l of logs) {
    const d = day(l.log_date);
    d.kcal += l.kcal;
    d.protein += l.protein_g;
    d.carbs += l.carbs_g;
    d.fat += l.fat_g;
    d.fibre += l.fibre_g;
  }
  for (const c of checks) Object.assign(day(c.log_date), { water: c.water_ml, sleep: c.sleep_hours, steps: c.steps });
  for (const w of weights) day(w.log_date).weight = w.weight_kg;

  const n = (v: number) => Math.round(v * 10) / 10;
  const lines = ['date,kcal,protein,carbs,fat,fibre,water,sleep,steps,weight'];
  for (const date of [...days.keys()].sort()) {
    const d = days.get(date)!;
    lines.push([date, n(d.kcal), n(d.protein), n(d.carbs), n(d.fat), n(d.fibre), d.water ?? '', d.sleep ?? '', d.steps ?? '', d.weight ?? ''].join(','));
  }
  res.type('text/csv').attachment(`fuellog-${req.today}.csv`).send(`${lines.join('\n')}\n`);
}));
