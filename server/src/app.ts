import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env, isProd } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFound } from './middleware/error.js';
import { serveClient } from './middleware/serve-client.js';
import { authRouter, usersRouter } from './modules/auth/auth.routes.js';
import { adminContentRouter, contentRouter } from './modules/content/content.routes.js';
import { adminLessonsRouter, lessonsRouter } from './modules/lessons/lesson.routes.js';
import { adminCommerceRouter, commerceRouter } from './modules/commerce/commerce.routes.js';
import { trackerRouter } from './modules/tracker/tracker.routes.js';
import { adminQuestionsRouter, questionsRouter } from './modules/questions/question.routes.js';
import { adminAuditRouter } from './modules/audit/audit.routes.js';
import { adminConsoleRouter } from './modules/admin-console/admin-console.routes.js';
import { settingsRouter, adminSettingsRouter } from './modules/settings/settings.routes.js';

export function createApp(): Express {
  const app = express();

  // Behind a reverse proxy in prod: makes req.ip and Secure cookies work.
  if (isProd) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(
    express.json({
      limit: '1mb',
      // Stash the raw body so the Razorpay webhook can verify its signature.
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ status: 'ok', service: 'parallax-flow-server', env: env.NODE_ENV });
  });

  // Baseline per-IP throttle across the whole API (defense-in-depth; sensitive
  // routes add tighter limits on top). Generous enough for a power user reading
  // a long secured PDF. Skipped under test so smoke suites aren't throttled.
  if (env.NODE_ENV !== 'test') {
    app.use(
      '/api',
      rateLimit({ windowMs: 5 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }),
    );
  }

  // Feature routers (more mounted here as phases land).
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/admin/content', adminContentRouter);
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/admin/lessons', adminLessonsRouter);
  app.use('/api/commerce', commerceRouter);
  app.use('/api/admin/commerce', adminCommerceRouter);
  app.use('/api/tracker', trackerRouter);
  app.use('/api/questions', questionsRouter);
  app.use('/api/admin/questions', adminQuestionsRouter);
  app.use('/api/admin/audit', adminAuditRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/admin/settings', adminSettingsRouter);
  // Command centre (overview, students, orders, control actions). Mounted last on
  // /api/admin so the specific prefixes above match first; uses per-route guards.
  app.use('/api/admin', adminConsoleRouter);

  // Unknown /api routes → JSON 404 (before the SPA fallback below, so a mistyped
  // API path never returns the HTML shell).
  app.use('/api', notFound);

  // Same-origin SPA hosting (production): serve the built client + client-side
  // routing fallback. No-op if no build is present, so dev/API-only is unaffected.
  serveClient(app);

  // Anything still unmatched (no client build present) → JSON 404.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
