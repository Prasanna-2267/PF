import pino from 'pino';
import { env, isDev } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';

export const logger = pino(
  isTest
    ? { level: 'silent' }
    : isDev
      ? {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : { level: 'info' },
);
