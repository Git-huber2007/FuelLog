import type { RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, DateParam, utcTodayISO } from '@fuellog/shared';
import { clientFor } from '../lib/supabase';
import { HttpError } from './errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      sb: SupabaseClient;
      /** The caller's local calendar date, which can differ from the server's UTC date by a day. */
      today: string;
    }
  }
}

export const auth: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return next(new HttpError(401, 'unauthenticated', 'Sign in to continue.'));
  const sb = clientFor(token);
  sb.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) return next(new HttpError(401, 'unauthenticated', 'Your session has expired. Sign in again.'));
      req.userId = data.user.id;
      req.sb = sb;
      const utc = utcTodayISO();
      const local = DateParam.safeParse(req.headers['x-local-date']);
      req.today = local.success && local.data >= addDays(utc, -1) && local.data <= addDays(utc, 1) ? local.data : utc;
      next();
    })
    .catch(next);
};
