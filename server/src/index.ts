import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectMongo, disconnectMongo } from './lib/db.js';
import { connectRedis, redis } from './lib/redis.js';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = createServer(app);

  // Socket.io is used from Phase 1 for single-device enforcement.
  const io = new SocketServer(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });
  io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'socket connected');
  });

  // Connect infra. In dev we tolerate missing services so the API still boots.
  try {
    await connectMongo();
  } catch (err) {
    logger.warn({ err: String(err) }, 'MongoDB not available — continuing (start it for Phase 1+)');
  }
  try {
    await connectRedis();
  } catch (err) {
    logger.warn({ err: String(err) }, 'Redis not available — continuing (start it for Phase 1+)');
    redis.disconnect(); // stop the reconnect loop while Redis is absent in dev
  }

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Parallax Flow API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    httpServer.close();
    io.close();
    await disconnectMongo().catch(() => undefined);
    await redis.quit().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
