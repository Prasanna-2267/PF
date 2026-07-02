import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Locate the built client (`client/dist`). Resolution order:
 *   1. CLIENT_DIST_DIR env override (absolute or cwd-relative),
 *   2. ../client/dist  (start runs from server/ — the Render/prod layout),
 *   3. client/dist     (start runs from the repo root).
 * Returns null if no build is present (e.g. API-only dev).
 */
function clientDistDir(): string | null {
  const candidates = [
    env.CLIENT_DIST_DIR,
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ].filter((c): c is string => Boolean(c));

  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return null;
}

/**
 * Serve the built SPA from the same origin as the API. Same-origin means the
 * auth cookies stay first-party (sameSite=lax) and there is no CORS to manage —
 * one service serves both the app and /api. No-op when no build is present, so
 * this is safe to call unconditionally.
 *
 * Mount AFTER the /api routers (and after `app.use('/api', notFound)`), so a
 * mistyped API path returns a JSON 404 rather than the SPA shell.
 */
export function serveClient(app: Express): void {
  const dir = clientDistDir();
  if (!dir) {
    logger.warn('No client build found — serving API only. Run `npm run build` in client/.');
    return;
  }

  const indexHtml = path.join(dir, 'index.html');

  // Hashed assets (JS/CSS/images) are immutable — cache them hard.
  app.use(express.static(dir, { index: false, maxAge: '1y', etag: true }));

  // SPA fallback: every other GET returns index.html so client-side routing
  // works on deep links / refresh. index.html itself is never cached, so a new
  // deploy is picked up immediately.
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(indexHtml, { headers: { 'Cache-Control': 'no-cache' } }, (err) => {
      if (err) next(err);
    });
  });

  logger.info(`🖥️  Serving client SPA from ${dir}`);
}
