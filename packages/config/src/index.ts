if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv/config');
  } catch {}
}

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AMQP_URL: z.string().default('amqp://guest:guest@localhost'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/lunchday'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MARKET_URL: z.string().default('https://recruitment.alegra.com/api/farmers-market'),
  RMQ_PREFETCH: z.coerce.number().default(100),
  MARKET_PREFETCH: z.coerce.number().default(30),
  MARKET_MAX_ATTEMPTS: z.coerce.number().default(6),
  MARKET_BASE_BACKOFF_MS: z.coerce.number().default(150),
  RECONCILER_MAX_RETRIES: z.coerce.number().default(6),
  RECONCILER_EVERY_MS: z.coerce.number().default(15000),
  RECONCILER_BASE_DELAY_MIN: z.coerce.number().default(1),
  RECONCILER_BATCH_LIMIT: z.coerce.number().default(200),
});

export type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
