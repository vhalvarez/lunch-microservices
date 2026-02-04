import { env } from '@lunch/config';
import { createBus } from '@lunch/bus';
import { createLogger } from '@lunch/logger';
import { getDbPool, closeDatabase } from '@lunch/db';
import { registerPurchaseHandler } from './handlers/purchase.handler.js';

const log = createLogger('market-adapter');
const pool = getDbPool('market-adapter-svc');

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  await registerPurchaseHandler(bus, pool);

  log.info('market-adapter-svc up (refactored ✅)');

  const shutdown = async () => {
    try {
      await closeDatabase('market-adapter-svc');
    } catch { }
    try {
      await (bus as any).close?.();
    } catch { }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
