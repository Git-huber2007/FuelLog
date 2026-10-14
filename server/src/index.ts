import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isProd } from './env';
import { auth } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errors';
import { directIpRateLimit, ipRateLimit, userRateLimit } from './middleware/rateLimit';
import { aiRouter } from './routes/ai';
import { daysRouter } from './routes/days';
import { exportRouter } from './routes/export';
import { foodsRouter } from './routes/foods';
import { photosRouter } from './routes/photos';
import { profileRouter } from './routes/profile';
import { progressRouter } from './routes/progress';
import { savedMealsRouter } from './routes/savedMeals';
import { workoutRouter } from './routes/workout';
import { routineRouter } from './routes/routine';
import { exercisesRouter } from './routes/exercises';
import { clientErrorsRouter } from './routes/clientErrors';
import { exercisePhotosRouter } from './routes/exercisePhotos';
import { checkRequiredSchema } from './lib/schemaCheck';

const app = express();
app.set('trust proxy', 1); // one hop: the host's HTTPS proxy
app.disable('x-powered-by');

const supabaseOrigin = new URL(env.SUPABASE_URL).origin;
app.use(helmet({
  hsts: isProd,
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // React sets style attributes for bar widths and chart geometry
      imgSrc: ["'self'", 'data:', 'blob:', supabaseOrigin, 'https://cdn.jsdelivr.net', 'https://raw.githubusercontent.com', 'https://cdn.statically.io'], // jsDelivr, GitHub and Statically serve exercise-library photos
      connectSrc: ["'self'", supabaseOrigin, supabaseOrigin.replace(/^http/, 'ws')],
      mediaSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));
if (!isProd) app.use(cors({ origin: env.CLIENT_ORIGIN })); // production is same-origin

// Rate limiting and no-store headers before reading request bodies into memory
app.use('/api', directIpRateLimit, ipRateLimit, (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.baseUrl}${req.path} ${res.statusCode} ${Date.now() - started}ms user=${req.userId ?? '-'}`);
  });
  next();
});

// Global body limit 100 kB; 6 MB only on /api/ai/parse-photo
app.use('/api/ai/parse-photo', express.json({ limit: '6mb' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  const schema = await checkRequiredSchema();
  if (!schema.ok) {
    return res.status(503).json({ ok: false, reason: 'schema' });
  }
  res.json({ ok: true });
});

app.use('/api', clientErrorsRouter);
app.use('/api', exercisePhotosRouter);
app.use('/api', auth, userRateLimit, profileRouter, foodsRouter, daysRouter, workoutRouter, routineRouter, exercisesRouter, savedMealsRouter, progressRouter, photosRouter, aiRouter, exportRouter, notFound);

// Serves the built client when it is there (single-service deploy). With the client on Vercel it is not built here, and this is skipped.
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (isProd && existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache').sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`FuelLog API listening on port ${env.PORT} (${env.NODE_ENV})${env.GEMINI_API_KEY ? '' : ', AI disabled: GEMINI_API_KEY is empty'}`);
  checkRequiredSchema().then((result) => {
    if (!result.ok) {
      console.warn(`[Startup Warning] Database is missing required schema: ${result.missing}`);
    }
  }).catch((err) => {
    console.error('Initial database schema check error:', err);
  });
});

// Proxy-safe timeouts (keep-alive must exceed upstream reverse proxy idle timeout, e.g. 60s)
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

// Clean shutdown on SIGTERM
let shuttingDown = false;
process.on('SIGTERM', () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('SIGTERM received: stopping new connections and draining in-flight requests...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('10-second drain window expired; forcing process exit.');
    process.exit(0);
  }, 10_000).unref();
});

