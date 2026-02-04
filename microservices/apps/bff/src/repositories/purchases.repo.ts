import type { Pool } from 'pg';

export class PurchasesRepository {
    constructor(private pool: Pool) { }

    async countPurchases(whereSql: string, params: (string | number)[]) {
        return this.pool.query<{ total: string }>(
            `select count(*)::bigint as total from market_purchases ${whereSql}`,
            params,
        );
    }

    async getPurchases(whereSql: string, params: (string | number)[]) {
        return this.pool.query<{
            id: string;
            plate_id: string;
            ingredient: string;
            qty_requested: number;
            quantity_sold: number;
            created_at: string;
        }>(
            `select id, plate_id, ingredient, qty_requested, quantity_sold, created_at
           from market_purchases
           ${whereSql}
          order by created_at desc
          limit $${params.length - 1}
         offset $${params.length}`,
            params,
        );
    }
}
