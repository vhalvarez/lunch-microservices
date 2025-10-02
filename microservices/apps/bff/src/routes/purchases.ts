import type { FastifyInstance } from 'fastify';

import { PurchasesQuery } from '@lunch/shared-kernel';

import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerPurchaseRoutes(router: FastifyInstance, ctx: RouteContext) {
  router.get('/purchases', async (req, reply) => {
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

    const { rows: countRows } = await ctx.pool.query<{ total: string }>(
      `select count(*)::bigint as total from market_purchases ${whereSql}`,
      params,
    );

    params.push(limit);
    params.push(offset);
    const { rows } = await ctx.pool.query<{
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
}
