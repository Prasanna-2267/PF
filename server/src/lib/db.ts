import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export async function connectMongo(): Promise<void> {
  if (env.DNS_SERVERS) {
    const servers = env.DNS_SERVERS.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length) {
      dns.setServers(servers);
      logger.info({ servers }, 'Using custom DNS resolvers');
    }
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info('✅ MongoDB connected');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
