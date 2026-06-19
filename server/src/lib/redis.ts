import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  // Give up reconnecting after a few attempts instead of spamming forever
  // (e.g. when Redis isn't running locally in early phases).
  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 1000)),
});

redis.on('error', (err) => logger.warn({ err: err.message }, 'Redis error'));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  logger.info('✅ Redis connected');
}
