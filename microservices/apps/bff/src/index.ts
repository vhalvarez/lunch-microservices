import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { createBus } from '@lunch/bus';
import { getDbPool, closeDatabase } from '@lunch/db';

import { registerRoutes } from './routes/index.js';

const pool = getDbPool('bff');
const log = createLogger('bff');
const PORT = Number(env.BFF_PORT ?? 4000);
const PREFIX = env.BFF_PREFIX ?? '/api/v1';

async function main() {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: [
      'http://localhost:5173', // Vite default
      'http://localhost:5174', // Vite alternative port
      'http://localhost:3000', // Other common frontend port
      /^https:\/\/.*\.alegra\.com$/, // Production domain example
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Rate limiting global: 100 requests por minuto por IP
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1', '::1'], // Whitelist localhost
    errorResponseBuilder: (req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${Math.ceil(Number(context.after) / 1000)} seconds.`,
      retryAfter: Math.ceil(Number(context.after) / 1000),
    }),
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  const bus = createBus(env.AMQP_URL, Number(env.RMQ_PREFETCH));
  await bus.connect();

  await app.register(async (router) => {
    registerRoutes(router, { bus, pool, log });
  }, { prefix: PREFIX });

  const close = async () => {
    try {
      await bus.close?.();
    } catch { }
    try {
      await closeDatabase('bff');
    } catch { }
    try {
      await app.close();
    } catch { }
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  await app.listen({ port: PORT, host: '0.0.0.0' });
  log.info({ port: PORT, prefix: PREFIX }, 'bff up');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
