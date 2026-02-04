import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { getDbPool } from '@lunch/db';
import { createRedis } from '@lunch/redis';
import { createBus } from '@lunch/bus';
import { startReconciler } from './reconciler.js';
import { registerReserveHandler } from './handlers/reserve.handler.js';
import { registerPurchaseHandler } from './handlers/purchase.handler.js';

const log = createLogger('inventory-svc');
const pool = getDbPool('inventory-svc');
const redis = createRedis(env.REDIS_URL);

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  // Registrar Handlers
  await registerReserveHandler(bus, pool, redis);
  await registerPurchaseHandler(bus, pool, redis);

  startReconciler(pool as any, bus, redis);

  log.info('inventory-svc up (refactored ✅)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
