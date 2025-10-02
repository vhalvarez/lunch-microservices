import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { Bus } from '@lunch/messaging';
import { getDbPool, closeDatabase } from '@lunch/db';

import { registerRoutes } from './routes/index.js';

const pool = getDbPool('bff');
const log = createLogger('bff');
const PORT = Number(env.BFF_PORT ?? 4000);
const PREFIX = env.BFF_PREFIX ?? '/api/v1';

async function main() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  const bus = new Bus({ url: env.AMQP_URL, prefetch: env.RMQ_PREFETCH });
  await bus.connect();

  await app.register(async (router) => {
    registerRoutes(router, { bus, pool, log });
  }, { prefix: PREFIX });

  const close = async () => {
    try {
      await bus.close?.();
    } catch {}
    try {
      await closeDatabase('bff');
    } catch {}
    try {
      await app.close();
    } catch {}
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
