import { Exchanges, RoutingKeys, OrderCreateRequested } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import type { Bus } from '@lunch/bus';
import { OrderService } from '../core/order.service.js';
import { env } from '@lunch/config';

const log = createLogger('create-order-handler');

export async function registerCreateOrderHandler(bus: Bus) {
    await bus.subscribe(
        'order.control.q',
        [{ exchange: Exchanges.order, rk: RoutingKeys.orderCreateRequested }],
        async (msg: unknown) => {
            const parsed = OrderCreateRequested.safeParse(msg);
            if (!parsed.success) {
                log.warn({ issues: parsed.error.issues }, 'invalid order.create.requested');
                return;
            }

            const service = new OrderService(bus);
            await service.publishInBatches(parsed.data.count, Number(env.ORDER_BATCH_SIZE));
        },
    );
}
