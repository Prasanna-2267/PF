import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env, isProd } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminContentRouter, contentRouter } from './modules/content/content.routes.js';
import { adminLessonsRouter, lessonsRouter } from './modules/lessons/lesson.routes.js';
import { adminCommerceRouter, commerceRouter } from './modules/commerce/commerce.routes.js';
import { trackerRouter } from './modules/tracker/tracker.routes.js';

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

  // Feature routers (more mounted here as phases land).
  app.use('/api/auth', authRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/admin/content', adminContentRouter);
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/admin/lessons', adminLessonsRouter);
  app.use('/api/commerce', commerceRouter);
  app.use('/api/admin/commerce', adminCommerceRouter);
  app.use('/api/tracker', trackerRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
