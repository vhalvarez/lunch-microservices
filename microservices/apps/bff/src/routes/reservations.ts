import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { ReservationsQuery } from '@lunch/shared-kernel';

import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerReservationRoutes(router: FastifyInstance, ctx: RouteContext) {
  router.get('/reservations', async (req, reply) => {
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

    const { rows: countRows } = await ctx.pool.query<{ total: string }>(
      `select count(*)::bigint as total from reservations ${whereSql}`,
      params,
    );

    params.push(limit);
    params.push(offset);
    const { rows } = await ctx.pool.query<{
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

  router.get('/reservations/:plateId', async (req, reply) => {
    const parsed = IdParam.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    const { plateId } = parsed.data;

    const { rows: head } = await ctx.pool.query<{
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

    const { rows: items } = await ctx.pool.query<{
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

    const { rows: purchases } = await ctx.pool.query<{
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
}
