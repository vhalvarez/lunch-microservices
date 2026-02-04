import type { Pool } from 'pg';
import { createLogger } from '@lunch/logger';
import type { Ingredient } from '@lunch/shared-kernel';
import type { HistoricalConsumption } from '@lunch/recommender-ai';

const log = createLogger('data-collector');

interface ReservationItemRow {
    ingredient: string;
    needed: string;
    created_at: string;
    status: string;
}

interface StockRow {
    ingredient: string;
    qty: string;
}

interface ConsumptionStatsRow {
    ingredient: string;
    total_consumed: string;
    order_count: string;
    avg_per_order: string;
}

interface PurchaseHistoryRow {
    ingredient: string;
    total_requested: string;
    total_received: string;
    purchase_count: string;
}

interface PendingReservationRow {
    plate_id: string;
    ingredient: string;
    needed: string;
    reserved: string;
}

/**
 * Repositorio para recolectar datos históricos de consumo desde la base de datos
 */
export class DataCollectorRepository {
    constructor(private pool: Pool) { }

    /**
     * Obtiene datos históricos de consumo de ingredientes
     * @param windowHours - Ventana de tiempo en horas para analizar
     */
    async getHistoricalConsumption(windowHours: number): Promise<HistoricalConsumption[]> {
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

        try {
            const { rows } = await this.pool.query<ReservationItemRow>(
                `SELECT 
          ri.ingredient,
          ri.needed,
          r.created_at,
          r.status
        FROM reservation_items ri
        INNER JOIN reservations r ON ri.plate_id = r.plate_id
        WHERE r.created_at >= $1
          AND r.status IN ('reserved', 'pending')
        ORDER BY r.created_at ASC`,
                [since],
            );

            const consumption: HistoricalConsumption[] = rows.map((row: ReservationItemRow) => ({
                ingredient: row.ingredient as Ingredient,
                quantityConsumed: Number(row.needed),
                timestamp: new Date(row.created_at),
                currentStock: 0, // Luego se actualiza
            }));

            log.info({ dataPoints: consumption.length, windowHours }, 'Historical consumption collected');

            return consumption;
        } catch (error) {
            log.error({ error, windowHours }, 'Failed to collect historical consumption');
            throw error;
        }
    }

    /**
     * Obtiene el stock actual de todos los ingredientes
     */
    async getCurrentStock(): Promise<Record<Ingredient, number>> {
        try {
            const { rows } = await this.pool.query<StockRow>(
                `SELECT ingredient, qty FROM stock ORDER BY ingredient`,
            );

            const stock: Record<string, number> = {};
            for (const row of rows) {
                stock[row.ingredient] = Number(row.qty);
            }

            log.debug({ ingredients: Object.keys(stock).length }, 'Current stock retrieved');

            return stock as Record<Ingredient, number>;
        } catch (error) {
            log.error({ error }, 'Failed to get current stock');
            throw error;
        }
    }

    /**
     * Obtiene estadísticas agregadas de consumo por ingrediente
     */
    async getConsumptionStats(
        windowHours: number,
    ): Promise<
        Array<{
            ingredient: Ingredient;
            totalConsumed: number;
            orderCount: number;
            avgPerOrder: number;
        }>
    > {
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

        try {
            const { rows } = await this.pool.query<ConsumptionStatsRow>(
                `SELECT 
          ri.ingredient,
          ri.needed,
          SUM(ri.needed)::bigint as total_consumed,
          COUNT(DISTINCT ri.plate_id)::bigint as order_count,
          AVG(ri.needed)::float as avg_per_order
        FROM reservation_items ri
        INNER JOIN reservations r ON ri.plate_id = r.plate_id
        WHERE r.created_at >= $1
        GROUP BY ri.ingredient
        ORDER BY total_consumed DESC`,
                [since],
            );

            const stats = rows.map((row: ConsumptionStatsRow) => ({
                ingredient: row.ingredient as Ingredient,
                totalConsumed: Number(row.total_consumed),
                orderCount: Number(row.order_count),
                avgPerOrder: Number(row.avg_per_order),
            }));

            log.info({ statsCount: stats.length, windowHours }, 'Consumption stats collected');

            return stats;
        } catch (error) {
            log.error({ error, windowHours }, 'Failed to get consumption stats');
            throw error;
        }
    }

    /**
     * Obtiene el historial de compras en el mercado
     */
    async getMarketPurchases(
        windowHours: number,
    ): Promise<
        Array<{
            ingredient: Ingredient;
            timestamp: Date;
            quantityRequested: number;
            quantitySold: number;
            plateId: string;
        }>
    > {
        const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

        try {
            const { rows } = await this.pool.query<{
                ingredient: string;
                created_at: string;
                qty_requested: string;
                quantity_sold: string;
                plate_id: string;
            }>(
                `SELECT 
          ingredient,
          created_at,
          qty_requested,
          quantity_sold,
          plate_id
        FROM market_purchases
        WHERE created_at >= $1
        ORDER BY created_at ASC`,
                [since],
            );

            const purchases = rows.map((row: typeof rows[0]) => ({
                ingredient: row.ingredient as Ingredient,
                timestamp: new Date(row.created_at),
                quantityRequested: Number(row.qty_requested),
                quantitySold: Number(row.quantity_sold),
                plateId: row.plate_id,
            }));

            log.info({ purchasesCount: purchases.length, windowHours }, 'Market purchases retrieved');

            return purchases;
        } catch (error) {
            log.error({ error, windowHours }, 'Failed to get market purchases');
            throw error;
        }
    }

    /**
     * Obtiene reservas pendientes (que aún no están completas)
     */
    async getPendingReservations(): Promise<
        Array<{
            plateId: string;
            ingredient: Ingredient;
            needed: number;
            reserved: number;
            missing: number;
        }>
    > {
        try {
            const { rows } = await this.pool.query<PendingReservationRow>(
                `SELECT 
          ri.plate_id,
          ri.ingredient,
          ri.needed,
          ri.reserved
        FROM reservation_items ri
        INNER JOIN reservations r ON ri.plate_id = r.plate_id
        WHERE r.status = 'pending'
          AND ri.needed > ri.reserved
        ORDER BY r.created_at ASC`,
            );

            const pending = rows.map((row: PendingReservationRow) => ({
                plateId: row.plate_id,
                ingredient: row.ingredient as Ingredient,
                needed: Number(row.needed),
                reserved: Number(row.reserved),
                missing: Number(row.needed) - Number(row.reserved),
            }));

            log.debug({ pendingCount: pending.length }, 'Pending reservations retrieved');

            return pending;
        } catch (error) {
            log.error({ error }, 'Failed to get pending reservations');
            throw error;
        }
    }
}
