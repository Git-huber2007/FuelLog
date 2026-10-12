import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from './errors';

/** Parses each given part of the request and replaces it with the parsed value. */
export const validate = (schemas: { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }): RequestHandler => (req, res, next) => {
  for (const part of ['params', 'query', 'body'] as const) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const first = result.error.issues[0];
      const where = first.path.join('.');
      res.status(400).json({
        error: { code: 'validation', message: `${where ? `${where}: ` : ''}${first.message}`, issues: result.error.flatten() },
      });
      return;
    }
    req[part] = result.data;
  }
  next();
};

/** For write routes: the date in the path or body may not be after the caller's today. */
export const notFuture: RequestHandler = (req, _res, next) => {
  const date: unknown = req.params.date ?? req.body?.date ?? req.body?.log_date;
  if (typeof date === 'string' && date > req.today) return next(new HttpError(400, 'future_date', 'You cannot log to a future date.'));
  next();
};
