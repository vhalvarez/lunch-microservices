import type { PurchasesRepository } from '../repositories/purchases.repo.js';

export class PurchasesService {
    constructor(private repo: PurchasesRepository) { }

    async searchPurchases(params: {
        plateId?: string;
        ingredient?: string;
        status?: 'success' | 'failed';
        limit: number;
        offset: number;
    }) {
        const { plateId, ingredient, limit, offset } = params;
        const where: string[] = [];
        const queryParams: any[] = [];

        if (plateId) {
            queryParams.push(plateId);
            where.push(`plate_id = $${queryParams.length}`);
        }
        if (ingredient) {
            queryParams.push(ingredient);
            where.push(`ingredient = $${queryParams.length}`);
        }
        
        // Status filter logic
        if (params.status === 'success') {
            where.push(`quantity_sold >= qty_requested`);
        } else if (params.status === 'failed') {
            where.push(`quantity_sold < qty_requested`);
        }

        const whereSql = where.length ? `where ${where.join(' and ')}` : '';

        const { rows: countRows } = await this.repo.countPurchases(whereSql, queryParams);

        // Append limit/offset to params for the list query
        const listParams = [...queryParams, limit, offset];

        const { rows } = await this.repo.getPurchases(whereSql, listParams);

        return {
            total: Number(countRows[0]?.total ?? 0),
            limit,
            offset,
            data: rows,
        };
    }
}
