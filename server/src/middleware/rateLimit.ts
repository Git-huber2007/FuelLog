import rateLimit from 'express-rate-limit';

/** 120 requests a minute per signed-in user. Runs after auth, so userId is always set. */
export const userRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.userId,
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests. Wait a minute and try again.' } });
  },
});
