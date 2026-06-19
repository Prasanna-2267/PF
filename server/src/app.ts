import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ status: 'ok', service: 'parallax-flow-server', env: env.NODE_ENV });
  });

  // Feature routers are mounted here as phases land:
  // app.use('/api/auth', authRouter);
  // app.use('/api/content', contentRouter);
  // ...

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
