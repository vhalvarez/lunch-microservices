import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersService } from '../core/orders.service.js';
import type { Bus } from '@lunch/messaging';
import { Exchanges, RoutingKeys } from '@lunch/shared-kernel';

describe('OrdersService', () => {
    let service: OrdersService;
    let bus: Bus;

    beforeEach(() => {
        bus = {
            publish: vi.fn(),
        } as unknown as Bus;
        service = new OrdersService(bus);
    });

    it('createOrders should publish order create event', async () => {
        // Act
        const result = await service.createOrders(50);

        // Assert
        expect(result.accepted).toBe(true);
        expect(result.count).toBe(50);

        expect(bus.publish).toHaveBeenCalledWith(
            Exchanges.order,
            RoutingKeys.orderCreateRequested,
            expect.objectContaining({
                count: 50,
                messageId: expect.any(String)
            })
        );
    });
});
