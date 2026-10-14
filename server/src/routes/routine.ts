import { Router } from 'express';
import {
  RoutineDayInput,
  WeekdayParams,
  type RoutineDayRow,
} from '@fuellog/shared';
import { h, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';

export const routineRouter = Router();

// GET /routine: all configured weekdays for the current user
routineRouter.get('/routine', h(async (req, res) => {
  const rows = unwrap<RoutineDayRow[]>(
    await req.sb.from('routine_days').select('weekday,title,exercises').order('weekday')
  );
  res.json(rows);
}));

// GET /routine/:weekday: single day configuration
routineRouter.get('/routine/:weekday', validate({ params: WeekdayParams }), h(async (req, res) => {
  const weekday = Number(req.params.weekday);
  const row = unwrap<RoutineDayRow | null>(
    await req.sb.from('routine_days').select('weekday,title,exercises').eq('weekday', weekday).maybeSingle()
  );
  if (!row) {
    return res.json({ weekday, title: '', exercises: [] });
  }
  res.json(row);
}));

// PUT /routine/:weekday: saves or updates a weekday's routine
routineRouter.put(
  '/routine/:weekday',
  validate({ params: WeekdayParams, body: RoutineDayInput }),
  h(async (req, res) => {
    const weekday = Number(req.params.weekday);
    const body = req.body as RoutineDayInput;
    const row = unwrap<RoutineDayRow>(
      await req.sb
        .from('routine_days')
        .upsert(
          {
            user_id: req.userId,
            weekday,
            title: body.title,
            exercises: body.exercises,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,weekday' }
        )
        .select('weekday,title,exercises')
        .single()
    );
    res.json(row);
  })
);

// DELETE /routine/:weekday: deletes a weekday's routine (making it a rest day)
routineRouter.delete('/routine/:weekday', validate({ params: WeekdayParams }), h(async (req, res) => {
  const weekday = Number(req.params.weekday);
  await req.sb.from('routine_days').delete().eq('weekday', weekday);
  res.status(204).end();
}));
