import type { Pool } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('market-repo');

export class MarketRepository {
    constructor(private pool: Pool) { }

    async recordMarketPurchase(params: {
        plateId: string;
        ingredient: string;
        qtyRequested: number;
        quantitySold: number;
    }) {
        const { plateId, ingredient, qtyRequested, quantitySold } = params;
        try {
            await this.pool.query(
                `insert into market_purchases(plate_id, ingredient, qty_requested, quantity_sold)
         values ($1, $2, $3, $4)`,
                [plateId, ingredient, qtyRequested, quantitySold],
            );
        } catch (err) {
            log.error({ err, plateId, ingredient }, 'failed to insert market_purchases');
        }
    }
}
