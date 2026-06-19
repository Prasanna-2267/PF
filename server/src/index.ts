import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectMongo, disconnectMongo } from './lib/db.js';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = createServer(app);

  // Socket.io: real-time "logged out on another device" lands in Phase 1c.
  const io = new SocketServer(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });
  io.on('connection', (socket) => {
    logger.debug({ id: socket.id }, 'socket connected');
  });

  try {
    await connectMongo();
  } catch (err) {
    logger.error(
      { err: String(err) },
      'MongoDB connection failed — set MONGODB_URI in .env (see server/README.md)',
    );
  }

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Parallax Flow API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    httpServer.close();
    io.close();
    await disconnectMongo().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
