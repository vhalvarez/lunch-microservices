import { Exchanges, RoutingKeys } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import type { Bus } from '@lunch/bus';
import type { PredictorService } from '../core/predictor.service.js';

const log = createLogger('prediction-handler');

export async function registerPredictionHandler(bus: Bus, service: PredictorService) {
    // Order Completed
    await bus.subscribe(
        'predictor.order.completed.q',
        [{ exchange: Exchanges.order, rk: RoutingKeys.orderCompleted }],
        async (msg: any) => {
            try {
                await service.handleOrderCompleted();
            } catch (error) {
                log.error({ error }, 'Error processing order completed');
            }
        },
    );

    // Stock Low
    await bus.subscribe(
        'predictor.stock.low.q',
        [{ exchange: Exchanges.inventory, rk: RoutingKeys.stockLow }],
        async (msg: any) => {
            try {
                await service.handleLowStock(msg?.ingredient);
            } catch (error) {
                log.error({ error }, 'Error processing low stock');
            }
        },
    );
}
