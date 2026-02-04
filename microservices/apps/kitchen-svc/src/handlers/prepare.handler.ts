import { randomUUID } from 'crypto';
import { Exchanges, RoutingKeys, InventoryReserved, type PlatePrepared } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import { withIdempotency, type Redis } from '@lunch/redis';
import type { Bus } from '@lunch/bus';
import { KitchenRepository } from '../repositories/kitchen.repo.js';
import { KitchenService } from '../core/kitchen.service.js';
import type { Pool } from '@lunch/db';

const log = createLogger('prepare-handler');

export async function registerPrepareHandler(bus: Bus, pool: Pool, redis: Redis) {
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
                const repo = new KitchenRepository(pool);
                const service = new KitchenService(repo);

                const preparedAt = await service.preparePlate(e.plateId);

                if (!preparedAt) {
                    log.warn({ plateId: e.plateId }, 'reservation not found to mark prepared');
                    return;
                }

                const payload: PlatePrepared = {
                    messageId: randomUUID(),
                    plateId: e.plateId,
                    preparedAt: preparedAt.toISOString(),
                };

                // Publicar eventos
                await bus.publish(Exchanges.plate, RoutingKeys.platePrepared, payload);

                await bus.publish(Exchanges.order, RoutingKeys.orderCompleted, {
                    messageId: randomUUID(),
                    plateId: e.plateId,
                    preparedAt: preparedAt.toISOString(),
                });

                log.info({ plateId: e.plateId }, 'plate prepared');
            });
        },
    );
}
