import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

// shortcut: x-vercel-forwarded-for can be forged by someone calling Render directly to dodge this limit, per-user limit still applies after sign-in
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-vercel-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

/** Global IP rate limiter: 300 requests per 5 minutes per IP. Runs before auth to protect against DoS and token brute-forcing. */
export const ipRateLimit = rateLimit({
  windowMs: 5 * 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests from this IP. Wait a few minutes and try again.' } });
  },
});

/** Second limiter keyed strictly on req.ip with a high ceiling so direct callers cannot forge x-vercel-forwarded-for. */
export const directIpRateLimit = rateLimit({
  windowMs: 5 * 60_000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests from this IP. Wait a few minutes and try again.' } });
  },
});

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

/** 10 requests a minute per IP for client crash reporting. Keyed on IP, not the token: this route runs before auth, so a token's claims are unverified. */
export const clientErrorsRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'rate_limited', message: 'Too many error reports.' } });
  },
});



