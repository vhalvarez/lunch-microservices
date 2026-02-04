import { randomUUID } from 'crypto';
import { env } from '@lunch/config';
import { Exchanges, RoutingKeys, type InventoryReserveRequested } from '@lunch/shared-kernel';
import { getRandomRecipe } from '@lunch/recipes';
import { createLogger } from '@lunch/logger';
import type { Bus } from '@lunch/bus';

const log = createLogger('order-service');

export class OrderService {
    constructor(private bus: Bus) { }

    private buildReserveEvent(plateId: string): InventoryReserveRequested {
        const r = getRandomRecipe();
        return { messageId: randomUUID(), plateId, items: r.items };
    }

    async publishInBatches(total: number, batchSize = Number(env.ORDER_BATCH_SIZE ?? 100)) {
        let published = 0;
        while (published < total) {
            const n = Math.min(batchSize, total - published);

            await Promise.all(
                Array.from({ length: n }, async () => {
                    const evt = this.buildReserveEvent(randomUUID());
                    await this.bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserveRequested, evt);
                }),
            );

            published += n;
            await new Promise<void>((r) => setImmediate(r));
            log.info({ batch: n, published, total }, 'orders published');
        }
    }
}
