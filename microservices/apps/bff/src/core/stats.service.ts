import type { StatsRepository } from '../repositories/stats.repo.js';
import type { PurchaseStats } from '../interfaces/purchase.interface.js';

export class StatsService {
    constructor(private repo: StatsRepository) { }

    async getSummary() {
        const { rows: resCounts } = await this.repo.getReservationCounts();
        const { rows: stock } = await this.repo.getStock();

        const reservations = { pending: 0, reserved: 0, failed: 0, prepared: 0 } as Record<
            string,
            number
        >;
        for (const r of resCounts) reservations[r.k] = Number(r.count);

        return { reservations, stock };
    }

    async getPurchases(): Promise<PurchaseStats[]> {
        const { rows } = await this.repo.getPurchaseStats();

        return rows.map((r) => ({
            ingredient: r.ingredient,
            attempts: Number(r.attempts),
            requested: Number(r.requested),
            sold: Number(r.sold),
            lastAt: r.last_at,
        }));
    }

    async getTimings() {
        const { rows } = await this.repo.getTimings();
        const r = rows[0] ?? { avg_s: null, p95_s: null, count: 0 };
        return {
            avgSeconds: Number(r.avg_s ?? 0),
            p95Seconds: Number(r.p95_s ?? 0),
            count: Number(r.count ?? 0),
        };
    }

    async getMarketLogs() {
        const { rows } = await this.repo.getMarketLogs();
        return rows.map(r => ({
            id: r.id,
            ingredient: r.ingredient,
            qtyRequested: Number(r.qty_requested),
            quantitySold: Number(r.quantity_sold),
            createdAt: r.created_at,
        }));
    }

    async getTrafficStats() {
        const { rows } = await this.repo.getHourlyTraffic();
        // Return simple array of { hour, count }
        // Frontend can handle filling missing hours or filtering
        return rows.map(r => ({
            hour: r.hour,
            count: Number(r.count)
        }));
    }

    async getEfficiencyStats() {
        const { rows } = await this.repo.getKitchenEfficiency();
        const stats = rows[0] || { total_orders: 0, completed_orders: 0, avg_prep_time: 0, orders_per_hour: 0 };
        
        const total = Number(stats.total_orders);
        const completed = Number(stats.completed_orders);
        
        // Flow Efficiency: Completed / Total (of last 24h)
        const flowEfficiency = total > 0 ? (completed / total) * 100 : 100;

        return {
            flowEfficiency: Math.round(flowEfficiency),
            avgPrepTime: Number(stats.avg_prep_time), // seconds
            turnRate: Number(stats.orders_per_hour).toFixed(1)
        };
    }
}
