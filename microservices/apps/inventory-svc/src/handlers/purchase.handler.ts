import { randomUUID } from 'crypto';
import { Exchanges, RoutingKeys, PurchaseCompleted, PurchaseFailed, type InventoryReserved } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import { withTx, type Pool } from '@lunch/db';
import { withIdempotency, type Redis } from '@lunch/redis';
import type { Bus } from '@lunch/bus';
import { InventoryRepository } from '../repositories/inventory.repo.js';
import { InventoryService } from '../core/inventory.service.js';

const log = createLogger('purchase-handler');

export async function registerPurchaseHandler(bus: Bus, pool: Pool, redis: Redis) {
    // 1. Purchase Completed
    await bus.subscribe(
        'purchase.completed.to.inventory.q',
        [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseCompleted }],
        async (evt: unknown) => {
            const parsed = PurchaseCompleted.safeParse(evt);
            if (!parsed.success) {
                log.warn({ evt }, 'invalid PurchaseCompleted');
                return;
            }
            const e = parsed.data;

            await withIdempotency(redis, e.messageId, 60 * 60, async () => {
                const { allOk, itemsPub } = await withTx(pool, async (cx) => {
                    const repo = new InventoryRepository(cx);
                    const service = new InventoryService(repo);
                    return service.processPurchaseCompleted(e.plateId, e.purchased);
                });

                if (allOk) {
                    await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
                        messageId: randomUUID(),
                        plateId: e.plateId,
                        items: itemsPub,
                    } satisfies InventoryReserved);
                } else {
                    log.info(
                        { plateId: e.plateId },
                        'reservation incomplete after purchase.completed, returned to pending for reconciler',
                    );
                }
            });
        },
    );

    // 2. Purchase Failed
    await bus.subscribe(
        'purchase.failed.to.inventory.q',
        [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseFailed }],
        async (evt: unknown) => {
            const parsed = PurchaseFailed.safeParse(evt);
            if (!parsed.success) {
                log.warn({ evt }, 'invalid PurchaseFailed');
                return;
            }
            const e = parsed.data;

            await withIdempotency(redis, e.messageId, 3600, async () => {
                await withTx(pool, async (cx) => {
                    const repo = new InventoryRepository(cx);
                    const service = new InventoryService(repo);
                    const updated = await service.handlePurchaseFailed(e.plateId);

                    if (updated) {
                        log.warn(
                            { plateId: e.plateId },
                            'purchase failed, reservation returned to pending for retry',
                        );
                    }
                });
            });
        },
    );
}
