import { Router } from 'express';

export const exercisePhotosRouter = Router();

// In-memory cache for exercise images (buffers) to avoid repeated upstream requests
const photoCache = new Map<string, { buffer: Buffer; expiresAt: number }>();
const MAX_CACHE = 250;

exercisePhotosRouter.get('/exercises/:key/:frame', async (req, res, next) => {
  const { key, frame } = req.params;
  if (!/^[\w.-]+$/.test(key) || !/^[01]\.jpg$/.test(frame)) {
    return next();
  }

  const cacheKey = `${key}/${frame}`;
  const cached = photoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(cached.buffer);
  }

  const sources = [
    `https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`,
    `https://cdn.statically.io/gh/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`,
    `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`,
  ];

  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const upstream = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (upstream.ok) {
        const buffer = Buffer.from(await upstream.arrayBuffer());
        if (photoCache.size >= MAX_CACHE) {
          const firstKey = photoCache.keys().next().value;
          if (firstKey) photoCache.delete(firstKey);
        }
        photoCache.set(cacheKey, { buffer, expiresAt: Date.now() + 24 * 3600 * 1000 });
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(buffer);
      }
    } catch {
      // Continue to next fallback source
    }
  }

  return res.status(404).send('Exercise photo not found');
});
