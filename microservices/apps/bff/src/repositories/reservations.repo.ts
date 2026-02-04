import type { Pool } from 'pg';

export interface ReservationCriteria {
    status?: string;
    plateId?: string;
    prepared?: boolean;
    limit: number;
    offset: number;
}

export class ReservationsRepository {
    constructor(private pool: Pool) { }

    private buildWhere(criteria: Omit<ReservationCriteria, 'limit' | 'offset'>): { whereSql: string; params: any[] } {
        const where: string[] = [];
        const params: any[] = [];

        if (criteria.status) {
            params.push(criteria.status);
            where.push(`status = $${params.length}`);
        }
        if (criteria.prepared !== undefined) {
            where.push(criteria.prepared ? `prepared_at IS NOT NULL` : `prepared_at IS NULL`);
        }
        if (criteria.plateId) {
            params.push(criteria.plateId);
            where.push(`plate_id = $${params.length}`);
        }

        return {
            whereSql: where.length ? `where ${where.join(' and ')}` : '',
            params
        };
    }

    async countReservations(criteria: Omit<ReservationCriteria, 'limit' | 'offset'>) {
        const { whereSql, params } = this.buildWhere(criteria);
        return this.pool.query<{ total: string }>(
            `select count(*)::bigint as total from reservations ${whereSql}`,
            params,
        );
    }

    async searchReservations(criteria: ReservationCriteria) {
        const { whereSql, params } = this.buildWhere(criteria);
        
        // Add limit and offset
        params.push(criteria.limit);
        const limitIdx = params.length;
        
        params.push(criteria.offset);
        const offsetIdx = params.length;

        return this.pool.query<{
            plate_id: string;
            status: string;
            created_at: string;
            prepared_at: string | null;
        }>(
            `select plate_id, status, created_at, prepared_at
           from reservations
           ${whereSql}
          order by created_at desc
          limit $${limitIdx}
         offset $${offsetIdx}`,
            params,
        );
    }

    async getReservationById(plateId: string) {
        return this.pool.query<{
            plate_id: string;
            status: string;
            created_at: string;
            prepared_at: string | null;
            retry_count: number | null;
        }>(
            `select plate_id, status, created_at, prepared_at, retry_count
           from reservations
          where plate_id = $1`,
            [plateId],
        );
    }

    async getReservationItems(plateId: string) {
        return this.pool.query<{
            ingredient: string;
            needed: number;
            reserved: number;
        }>(
            `select ingredient, needed, reserved
           from reservation_items
          where plate_id = $1
          order by ingredient`,
            [plateId],
        );
    }

    async getMarketPurchasesForPlate(plateId: string) {
        return this.pool.query<{
            id: string;
            ingredient: string;
            qty_requested: number;
            quantity_sold: number;
            created_at: string;
        }>(
            `select id, ingredient, qty_requested, quantity_sold, created_at
           from market_purchases
          where plate_id = $1
          order by created_at asc`,
            [plateId],
        );
    }
}
