import { env } from '@lunch/config';
import { createBus } from '@lunch/bus';
import { createLogger } from '@lunch/logger';
import { registerCreateOrderHandler } from './handlers/create-order.handler.js';

const log = createLogger('order-svc');

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  await registerCreateOrderHandler(bus);

  log.info('order-svc up (refactored ✅)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
