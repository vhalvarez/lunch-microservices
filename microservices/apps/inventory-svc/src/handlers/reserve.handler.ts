import { randomUUID } from 'crypto';
import { Exchanges, RoutingKeys, InventoryReserveRequested, type PurchaseRequested, type InventoryReserved } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import { withTx, type Pool } from '@lunch/db';
import { withIdempotency, type Redis } from '@lunch/redis';
import type { Bus } from '@lunch/bus';
import { InventoryRepository } from '../repositories/inventory.repo.js';
import { InventoryService } from '../core/inventory.service.js';

const log = createLogger('inventory-handler');

export async function registerReserveHandler(bus: Bus, pool: Pool, redis: Redis) {
    await bus.subscribe(
        'inventory.reserve.requested.q',
        [{ exchange: Exchanges.inventory, rk: RoutingKeys.inventoryReserveRequested }],
        async (evt: unknown) => {
            const parsed = InventoryReserveRequested.safeParse(evt);
            if (!parsed.success) {
                log.warn({ evt }, 'invalid InventoryReserveRequested');
                return;
            }
            const e = parsed.data;

            await withIdempotency(redis, e.messageId, 60 * 60, async () => {
                const { shortages, shouldPurchase } = await withTx(pool, async (cx) => {
                    const repo = new InventoryRepository(cx);
                    const service = new InventoryService(repo);
                    return service.processReservation(e.plateId, e.items);
                });

                if (shouldPurchase) {
                    await bus.publish(Exchanges.purchase, RoutingKeys.purchaseRequested, {
                        messageId: randomUUID(),
                        plateId: e.plateId,
                        shortages,
                    } satisfies PurchaseRequested);
                } else {
                    await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
                        messageId: randomUUID(),
                        plateId: e.plateId,
                        items: e.items.map((it) => ({ ingredient: it.ingredient, qty: it.qty })),
                    } satisfies InventoryReserved);
                }
            });
        },
    );
}
