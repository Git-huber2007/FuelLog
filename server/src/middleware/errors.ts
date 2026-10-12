import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Express 4 does not catch rejected promises, so every async handler goes through this. */
export const h = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => {
  fn(req, res).catch(next);
};

/** Returns the data of a Supabase result or throws the matching HttpError. */
export function unwrap<T>(result: { data: T | null; error: { code?: string } | null }): T {
  const { data, error } = result;
  if (error) {
    if (error.code === 'PGRST116') throw new HttpError(404, 'not_found', 'Not found.');
    if (error.code === '23505') throw new HttpError(400, 'duplicate', 'That already exists.');
    console.error(`database error ${error.code ?? 'unknown'}`); // code only: messages can echo user data
    throw new HttpError(500, 'server_error', 'Something went wrong. Try again.');
  }
  return data as T;
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'No such route.' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void _next;
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'validation', message: 'Invalid input.', issues: err.flatten() } });
  } else if (err?.type === 'entity.too.large') {
    res.status(400).json({ error: { code: 'too_large', message: 'That upload is too large.' } });
  } else if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'bad_json', message: 'The request body is not valid JSON.' } });
  } else {
    console.error(`unhandled ${err?.name ?? 'error'}`);
    res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong. Try again.' } });
  }
};
