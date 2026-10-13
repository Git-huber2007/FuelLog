import { Router } from 'express';
import { z } from 'zod';
import { h } from '../middleware/errors';
import { validate } from '../middleware/validate';
import { clientErrorsRateLimit } from '../middleware/rateLimit';

const ClientErrorBody = z.object({
  name: z.string().trim().max(100),
  message: z.string().trim().max(500),
  route: z.string().trim().max(200),
  version: z.string().trim().max(50),
});

export const clientErrorsRouter = Router();

clientErrorsRouter.post(
  '/client-errors',
  clientErrorsRateLimit,
  validate({ body: ClientErrorBody }),
  h(async (req, res) => {
    const { name, message, route, version } = req.body;
    console.warn(`[Client Crash] app=${version} route=${route} error=${name}: ${message}`);
    res.status(204).end();
  }),
);
