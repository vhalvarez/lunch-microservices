import type { PoolClient } from 'pg';
import type { Ingredient } from '@lunch/shared-kernel';

export class InventoryRepository {
    constructor(private cx: PoolClient) { }

    async createReservation(plateId: string) {
        await this.cx.query(
            `insert into reservations(plate_id, status)
       values ($1,'pending')
       on conflict (plate_id) do update set status='pending'`,
            [plateId],
        );
    }

    async getReservationItems(plateId: string) {
        const { rows } = await this.cx.query(
            `select ingredient, needed, reserved
         from reservation_items
        where plate_id=$1
        order by ingredient`,
            [plateId],
        );
        return rows;
    }

    async upsertReservationItems(plateId: string, items: { ingredient: string; qty: number }[]) {
        for (const r of items) {
            await this.cx.query(
                `insert into reservation_items(plate_id, ingredient, needed, reserved)
         values ($1,$2,$3,0)
         on conflict (plate_id, ingredient)
         do update set needed=excluded.needed`,
                [plateId, r.ingredient, r.qty],
            );
        }
    }

    async getStockForUpdate(ingredient: string) {
        const row = await this.cx.query('select qty from stock where ingredient=$1 for update', [
            ingredient,
        ]);
        return Number(row?.rows?.[0]?.qty ?? 0);
    }

    async updateStock(ingredient: string, qtyToRemove: number) {
        await this.cx.query('update stock set qty = qty - $1 where ingredient=$2', [
            qtyToRemove,
            ingredient,
        ]);
    }

    async setReservationReserved(plateId: string, ingredient: string, reservedQty: number) {
        await this.cx.query(
            'update reservation_items set reserved = $1 where plate_id=$2 and ingredient=$3',
            [reservedQty, plateId, ingredient],
        );
    }

    async incrementReservationReserved(plateId: string, ingredient: string, addQty: number) {
        await this.cx.query(
            'update reservation_items set reserved = reserved + $1 where plate_id=$2 and ingredient=$3',
            [addQty, plateId, ingredient],
        );
    }

    async updateReservationStatus(plateId: string, status: 'pending' | 'reserved' | 'purchasing') {
        await this.cx.query('update reservations set status=$2 where plate_id=$1', [plateId, status]);
    }

    async upsertStock(ingredient: string, qty: number) {
        await this.cx.query(
            `insert into stock(ingredient, qty) values ($1,$2)
       on conflict (ingredient) do update set qty = stock.qty + EXCLUDED.qty`,
            [ingredient, qty],
        );
    }

    async findPendingReservationToRetry(plateId: string) {
        const { rows } = await this.cx.query(
            `select 1
         from reservation_items
        where plate_id = $1
          and needed > reserved
        limit 1`,
            [plateId],
        );
        return rows.length > 0;
    }
}
