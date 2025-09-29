if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv/config');
  } catch {}
}

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Infra
  AMQP_URL: z.string().default('amqp://guest:guest@localhost'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/lunchday'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // RabbitMQ
  RMQ_PREFETCH: z.coerce.number().int().min(1).default(100),

  // Mercado (HTTP externo)
  MARKET_URL: z.string().default('https://recruitment.alegra.com/api/farmers-market'),
  MARKET_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(6),
  MARKET_BASE_BACKOFF_MS: z.coerce.number().int().min(1).default(150),
  MARKET_CONCURRENCY: z.coerce.number().int().min(1).default(64),
  MARKET_HTTP_CONN: z.coerce.number().int().min(1).default(32),

  // Reconciler
  RECONCILER_MAX_RETRIES: z.coerce.number().int().min(0).default(6),
  RECONCILER_EVERY_MS: z.coerce.number().int().min(100).default(15_000),
  RECONCILER_BASE_DELAY_MIN: z.coerce.number().int().min(1).default(1),
  RECONCILER_BATCH_LIMIT: z.coerce.number().int().min(1).default(200),
  RECONCILER_BASE_SECONDS: z.coerce.number().int().min(1).default(3),

  // order-svc / BFF
  ORDER_BATCH_SIZE: z.coerce.number().int().min(1).default(100),
  BFF_PORT: z.coerce.number().int().min(1).default(4000),
});

export type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
