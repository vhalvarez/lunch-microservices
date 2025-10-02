import type { FastifyInstance } from 'fastify';

import type { PurchaseStats, PurchaseStatsRow } from '../interfaces/purchase.interface';
import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerStatsRoutes(router: FastifyInstance, ctx: RouteContext) {
  router.get('/stats/summary', async () => {
    const { rows: resCounts } = await ctx.pool.query<{ k: string; count: string }>(
      `select 'pending'  as k, count(*)::bigint from reservations where status='pending'
        union all
       select 'reserved' as k, count(*)::bigint from reservations where status='reserved'
        union all
       select 'failed'   as k, count(*)::bigint from reservations where status='failed'
        union all
       select 'prepared' as k, count(*)::bigint from reservations where prepared_at is not null`,
    );

    const { rows: stock } = await ctx.pool.query<{ ingredient: string; qty: number }>(
      `select ingredient, qty
         from stock
        order by ingredient`,
    );

    const reservations = { pending: 0, reserved: 0, failed: 0, prepared: 0 } as Record<
      string,
      number
    >;
    for (const r of resCounts) reservations[r.k] = Number(r.count);

    return { reservations, stock };
  });

  router.get('/stats/purchases', async () => {
    const { rows } = await ctx.pool.query<{
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

    return rows.map(
      (r: PurchaseStatsRow): PurchaseStats => ({
        ingredient: r.ingredient,
        attempts: Number(r.attempts),
        requested: Number(r.requested),
        sold: Number(r.sold),
        lastAt: r.last_at,
      }),
    );
  });

  router.get('/stats/timings', async () => {
    const { rows } = await ctx.pool.query<{ avg_s: string; p95_s: string; count: string }>(`
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
    const r = rows[0] ?? { avg_s: null, p95_s: null, count: 0 };
    return {
      avgSeconds: Number(r.avg_s ?? 0),
      p95Seconds: Number(r.p95_s ?? 0),
      count: Number(r.count ?? 0),
    };
  });
}
