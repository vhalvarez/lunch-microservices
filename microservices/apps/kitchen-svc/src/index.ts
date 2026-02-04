import { env } from '@lunch/config';
import { createBus } from '@lunch/bus';
import { createLogger } from '@lunch/logger';
import { getDbPool } from '@lunch/db';
import { createRedis } from '@lunch/redis';
import { registerPrepareHandler } from './handlers/prepare.handler.js';

const log = createLogger('kitchen-svc');
const pool = getDbPool('kitchen-svc');
const redis = createRedis(env.REDIS_URL);

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  await registerPrepareHandler(bus, pool, redis);

  log.info('kitchen-svc up (refactored ✅)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
