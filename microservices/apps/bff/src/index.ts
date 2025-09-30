import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { Bus } from '@lunch/messaging';
import {
  Exchanges,
  PurchasesQuery,
  ReservationsQuery,
  RoutingKeys,
  type OrderCreateRequested,
} from '@lunch/shared-kernel';
import { RECIPES } from '@lunch/recipes';
import { createPool } from '@lunch/db';
import { PurchaseStats, PurchaseStatsRow } from './interfaces/purchase.interface';

const pool = createPool(env.DATABASE_URL);

const log = createLogger('bff');
const PORT = Number(env.BFF_PORT ?? 4000);

async function main() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  const bus = new Bus({ url: env.AMQP_URL, prefetch: env.RMQ_PREFETCH });
  await bus.connect();

  app.get('/health', async () => ({ ok: true }));

  const Body = z.object({ count: z.number().int().positive() });
  app.post('/orders', async (req, reply) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const payload: OrderCreateRequested = {
      messageId: crypto.randomUUID(),
      count: parsed.data.count,
    };

    await bus.publish(Exchanges.order, RoutingKeys.orderCreateRequested, payload);

    return reply.code(202).send({ accepted: true, count: parsed.data.count });
  });

  app.get('/recipes', async () => RECIPES);

  app.get('/inventory', async () => {
    const { rows } = await pool.query<{ ingredient: string; qty: number }>(
      `select ingredient, qty
       from stock
      order by ingredient asc`,
    );
    return rows;
  });

  app.get('/reservations', async (req, reply) => {
    const parsed = ReservationsQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    const { status, plateId, limit, offset, prepared } = parsed.data;
    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (prepared !== undefined) {
      where.push(prepared ? `prepared_at IS NOT NULL` : `prepared_at IS NULL`);
    }
    if (plateId) {
      params.push(plateId);
      where.push(`plate_id = $${params.length}`);
    }

    const whereSql = where.length ? `where ${where.join(' and ')}` : '';

    const { rows: countRows } = await pool.query<{ total: string }>(
      `select count(*)::bigint as total from reservations ${whereSql}`,
      params,
    );

    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query<{
      plate_id: string;
      status: string;
      created_at: string;
      prepared_at: string | null;
    }>(
      `select plate_id, status, created_at, prepared_at
       from reservations
       ${whereSql}
      order by created_at desc
      limit $${params.length - 1}
     offset $${params.length}`,
      params,
    );

    const data = rows.map(
      (r: {
        plate_id: string;
        status: string;
        created_at: string;
        prepared_at: string | null;
      }) => ({
        ...r,
        isPrepared: Boolean(r.prepared_at),
      }),
    );

    return {
      total: Number(countRows[0]?.total ?? 0),
      limit,
      offset,
      data,
    };
  });

  const IdParam = z.object({ plateId: z.uuid() });

  app.get('/reservations/:plateId', async (req, reply) => {
    const parsed = IdParam.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    const { plateId } = parsed.data;

    const { rows: head } = await pool.query<{
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
    if (head.length === 0) return reply.status(404).send({ error: 'not_found' });

    const { rows: items } = await pool.query<{
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

    const { rows: purchases } = await pool.query<{
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

    const headRow = head[0];
    return {
      ...headRow,
      isPrepared: Boolean(headRow.prepared_at),
      items,
      purchases,
    };
  });

  app.get('/purchases', async (req, reply) => {
    const parsed = PurchasesQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    const { plateId, ingredient, limit, offset } = parsed.data;
    const where: string[] = [];
    const params: any[] = [];

    if (plateId) {
      params.push(plateId);
      where.push(`plate_id = $${params.length}`);
    }
    if (ingredient) {
      params.push(ingredient);
      where.push(`ingredient = $${params.length}`);
    }
    const whereSql = where.length ? `where ${where.join(' and ')}` : '';

    const { rows: countRows } = await pool.query<{ total: string }>(
      `select count(*)::bigint as total from market_purchases ${whereSql}`,
      params,
    );

    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query<{
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

    return {
      total: Number(countRows[0]?.total ?? 0),
      limit,
      offset,
      data: rows,
    };
  });

  app.get('/stats/summary', async () => {
    const { rows: resCounts } = await pool.query<{ k: string; count: string }>(
      `select 'pending'  as k, count(*)::bigint from reservations where status='pending'
      union all
     select 'reserved' as k, count(*)::bigint from reservations where status='reserved'
      union all
     select 'failed'   as k, count(*)::bigint from reservations where status='failed'
      union all
     select 'prepared' as k, count(*)::bigint from reservations where prepared_at is not null`,
    );

    const { rows: stock } = await pool.query<{ ingredient: string; qty: number }>(
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

  // Stats de compras por ingrediente
  app.get('/stats/purchases', async () => {
    const { rows } = await pool.query<{
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

  app.get('/stats/timings', async () => {
    const { rows } = await pool.query<{ avg_s: string; p95_s: string; count: string }>(`
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

  // Start + shutdown
  const close = async () => {
    try {
      await bus.close?.();
    } catch {}
    try {
      await app.close();
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  await app.listen({ port: PORT, host: '0.0.0.0' }); // patrón estándar Fastify listen :contentReference[oaicite:3]{index=3}
  log.info({ port: PORT }, 'bff up');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
