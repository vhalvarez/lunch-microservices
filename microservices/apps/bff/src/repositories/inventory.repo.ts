import type { Pool } from 'pg';

export class InventoryRepository {
    constructor(private pool: Pool) { }

    async getStock() {
        return this.pool.query<{ ingredient: string; qty: number }>(
            `select ingredient, qty
         from stock
        order by ingredient asc`,
        );
    }
}
