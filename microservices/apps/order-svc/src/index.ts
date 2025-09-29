import { randomUUID } from 'crypto';
import { env } from '@lunch/config';
import { Bus } from '@lunch/messaging';
import { createLogger } from '@lunch/logger';
import {
  Exchanges,
  OrderCreateRequested,
  RoutingKeys,
  type InventoryReserveRequested,
} from '@lunch/shared-kernel';
import { getRandomRecipe } from '@lunch/recipes';

const log = createLogger('order-svc');

function buildReserveEvent(plateId: string): InventoryReserveRequested {
  const r = getRandomRecipe();
  return { messageId: crypto.randomUUID(), plateId, items: r.items };
}

async function publishInBatches(
  bus: Bus,
  total: number,
  batchSize = Number(env.ORDER_BATCH_SIZE ?? 100),
) {
  let published = 0;
  while (published < total) {
    const n = Math.min(batchSize, total - published);

    await Promise.all(
      Array.from({ length: n }, async () => {
        const evt = buildReserveEvent(randomUUID());
        await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserveRequested, evt);
      }),
    );

    published += n;
    await new Promise<void>((r) => setImmediate(r));
    log.info({ batch: n, published, total }, 'orders published');
  }
}

async function main() {
  const bus = new Bus({ url: env.AMQP_URL, prefetch: env.RMQ_PREFETCH });
  await bus.connect();
  log.info('order-svc up');

  await bus.subscribe(
    'order.control.q',
    [{ exchange: Exchanges.order, rk: RoutingKeys.orderCreateRequested }],
    async (msg: unknown) => {
      const parsed = OrderCreateRequested.safeParse(msg);
      if (!parsed.success) {
        log.warn({ issues: parsed.error.issues }, 'invalid order.create.requested');
        return;
      }
      await publishInBatches(bus, parsed.data.count, Number(env.ORDER_BATCH_SIZE));
    },
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
