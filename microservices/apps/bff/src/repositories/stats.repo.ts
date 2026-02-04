import type { Pool } from 'pg';

export class StatsRepository {
    constructor(private pool: Pool) { }

    async getReservationCounts() {
        return this.pool.query<{ k: string; count: string }>(
            `select 'pending'  as k, count(*)::bigint from reservations where status='pending'
        union all
       select 'reserved' as k, count(*)::bigint from reservations where status='reserved'
        union all
       select 'failed'   as k, count(*)::bigint from reservations where status='failed'
        union all
       select 'prepared' as k, count(*)::bigint from reservations where prepared_at is not null`,
        );
    }

    async getStock() {
        return this.pool.query<{ ingredient: string; qty: number }>(
            `select ingredient, qty
         from stock
        order by ingredient`,
        );
    }

    async getPurchaseStats() {
        return this.pool.query<{
            ingredient: string;
            attempts: string;
            requested: string;
            sold: string;
            last_at: string;
        }>(
            `select ingredient,
                count(*)::bigint as attempts,
                coalesce(sum(qty_requested),0)::bigint as requested,
                coalesce(sum(quantity_sold),0)::bigint as sold,
                max(created_at) as last_at
           from market_purchases
          group by ingredient
          order by ingredient`,
        );
    }

    async getTimings() {
        return this.pool.query<{ avg_s: string; p95_s: string; count: string }>(`
          with d as (
            select extract(epoch from (prepared_at - created_at)) as sec
            from reservations
            where prepared_at is not null
          )
          select avg(sec)::float as avg_s,
                percentile_cont(0.95) within group (order by sec)::float as p95_s,
                count(*)::bigint as count
          from d
        `);
    }

    async getMarketLogs() {
        return this.pool.query(
            `select id, ingredient, qty_requested, quantity_sold, created_at
             from market_purchases
             order by created_at desc
             limit 50`
        );
    }

    async getHourlyTraffic() {
        // Returns order count per hour for the last 24h
        return this.pool.query<{ hour: string; count: string }>(`
            SELECT 
                to_char(created_at, 'HH24') as hour, 
                count(*)::bigint as count
            FROM reservations
            WHERE created_at >= NOW() - INTERVAL '24 HOURS'
            GROUP BY 1
            ORDER BY 1
        `);
    }

    async getKitchenEfficiency() {
        // Calculate efficiency metrics from the last 24h
        return this.pool.query<{ 
            total_orders: string;
            completed_orders: string;
            avg_prep_time: string;
            orders_per_hour: string;
        }>(`
            WITH stats AS (
                SELECT 
                    count(*) as total,
                    count(*) FILTER (WHERE status = 'prepared') as completed,
                    avg(EXTRACT(EPOCH FROM (prepared_at - created_at))) FILTER (WHERE status = 'prepared') as avg_time,
                    count(*) / GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600, 1) as rate
                FROM reservations
                WHERE created_at >= NOW() - INTERVAL '24 HOURS'
            )
            SELECT 
                total::bigint as total_orders, 
                completed::bigint as completed_orders,
                coalesce(avg_time, 0)::float as avg_prep_time,
                coalesce(rate, 0)::float as orders_per_hour
            FROM stats
        `);
    }
}
