import { randomUUID } from 'crypto';
import { env } from '@lunch/config';
import { Bus } from '@lunch/messaging';
import { createLogger } from '@lunch/logger';
import { createPool } from '@lunch/db';
import { createRedis, withIdempotency } from '@lunch/redis';
import { jitter, sleep } from '@lunch/utils';
import { Exchanges, RoutingKeys, InventoryReserved } from '@lunch/shared-kernel';
import type { PlatePrepared } from '@lunch/shared-kernel';

const log = createLogger('kitchen-svc');
const pool = createPool(env.DATABASE_URL);
const redis = createRedis(env.REDIS_URL);

async function main() {
  const bus = new Bus({ url: env.AMQP_URL, prefetch: env.RMQ_PREFETCH });
  await bus.connect();

  await bus.subscribe(
    'kitchen.inventory.reserved.q',
    [{ exchange: Exchanges.inventory, rk: RoutingKeys.inventoryReserved }],
    async (evt: unknown) => {
      const parsed = InventoryReserved.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt, issues: parsed.error.issues }, 'invalid InventoryReserved');
        return;
      }
      const e = parsed.data;

      await withIdempotency(redis, e.messageId, 60 * 60, async () => {
        // Simulación de tiempo de cocina (200–600 ms, con jitter)
        await sleep(jitter(200));

        const { rows } = await pool.query<{ prepared_at: string | null }>(
          `
          update reservations
             set prepared_at = coalesce(prepared_at, now())
           where plate_id = $1
           returning prepared_at
        `,
          [e.plateId],
        );

        if (rows.length === 0) {
          log.warn({ plateId: e.plateId }, 'reservation not found to mark prepared');
          return;
        }

        const preparedAt = rows[0].prepared_at!;
        const payload: PlatePrepared = {
          messageId: randomUUID(),
          plateId: e.plateId,
          preparedAt: new Date(preparedAt).toISOString(),
        };

        await bus.publish(Exchanges.plate, RoutingKeys.platePrepared, payload);
        log.info({ plateId: e.plateId }, 'plate prepared');
      });
    },
  );

  log.info('kitchen-svc up');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
