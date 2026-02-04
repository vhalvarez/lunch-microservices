import { randomUUID } from 'node:crypto';
import type { Bus } from '@lunch/bus';
import { Exchanges, RoutingKeys, type OrderCreateRequested } from '@lunch/shared-kernel';

export class OrdersService {
    constructor(private bus: Bus) { }

    async createOrders(count: number) {
        const payload: OrderCreateRequested = {
            messageId: randomUUID(),
            count,
        };

        await this.bus.publish(Exchanges.order, RoutingKeys.orderCreateRequested, payload);
        return { accepted: true, count };
    }
}
