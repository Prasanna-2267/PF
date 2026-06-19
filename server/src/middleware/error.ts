import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';
import { isProd } from '../config/env.js';

/** Wrap an async route handler so rejected promises reach the error handler. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** Thrown by app code to return a specific HTTP status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: isProd ? 'Internal server error' : String(err) });
};
