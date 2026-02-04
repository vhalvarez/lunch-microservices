import { randomUUID } from 'crypto';
import { Exchanges, RoutingKeys, PurchaseRequested, type PurchaseCompleted } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import type { Bus } from '@lunch/bus';
import { MarketRepository } from '../repositories/market.repo.js';
import { MarketService } from '../core/market.service.js';
import type { Pool } from '@lunch/db';

const log = createLogger('purchase-handler');

export async function registerPurchaseHandler(bus: Bus, pool: Pool) {
    await bus.subscribe(
        'purchase.requested.q',
        [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseRequested }],
        async (evt: unknown) => {
            const parsed = PurchaseRequested.safeParse(evt);
            if (!parsed.success) {
                log.warn({ evt }, 'invalid PurchaseRequested');
                return;
            }
            const e = parsed.data;

            const repo = new MarketRepository(pool);
            const service = new MarketService(repo);

            const purchased: Record<string, number> = {};

            for (const s of e.shortages) {
                const { remaining, soldTotal } = await service.processShortage(s, e.plateId);

                if (soldTotal > 0) {
                    purchased[s.ingredient] = (purchased[s.ingredient] ?? 0) + soldTotal;
                }

                if (remaining > 0) {
                    await bus.publish(Exchanges.purchase, RoutingKeys.purchaseFailed, {
                        messageId: randomUUID(),
                        plateId: e.plateId,
                        ingredient: s.ingredient,
                        remaining,
                    });
                    return;
                }
            }

            const done: PurchaseCompleted = {
                messageId: randomUUID(),
                plateId: e.plateId,
                purchased: Object.entries(purchased).map(([ingredient, qty]) => ({
                    ingredient,
                    qty,
                })) as any,
            };

            await bus.publish(Exchanges.purchase, RoutingKeys.purchaseCompleted, done);
        },
    );
}
