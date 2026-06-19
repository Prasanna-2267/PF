import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Layered env loading (most-specific first; dotenv never overrides already-set
// vars, so the host/script environment always wins):
//   .env.<NODE_ENV>.local → .env.<NODE_ENV> → .env.local → .env
const NODE_ENV = process.env.NODE_ENV ?? 'development';
for (const file of [`.env.${NODE_ENV}.local`, `.env.${NODE_ENV}`, '.env.local', '.env']) {
  loadEnv({ path: file });
}

/**
 * Typed, validated environment. Core vars have safe dev defaults so the server
 * runs locally without extra setup. Later-phase secrets (R2, Razorpay, OpenAI,
 * mail) are optional here and validated within their own modules when used.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/parallax_flow'),
  // Optional: override DNS resolvers (comma-separated). Useful when the local
  // resolver can't do the SRV lookups that mongodb+srv:// requires.
  DNS_SERVERS: z.string().optional(),
  // Local-disk storage directory (used until Cloudflare R2 is configured).
  STORAGE_DIR: z.string().optional(),

  // Phase 1+ (optional until those phases wire them in)
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  MAIL_PROVIDER: z.string().optional(),
  MAIL_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
