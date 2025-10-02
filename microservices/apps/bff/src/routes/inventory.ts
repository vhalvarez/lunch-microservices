import type { FastifyInstance } from 'fastify';

import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerInventoryRoutes(router: FastifyInstance, ctx: RouteContext) {
  router.get('/inventory', async () => {
    const { rows } = await ctx.pool.query<{ ingredient: string; qty: number }>(
      `select ingredient, qty
         from stock
        order by ingredient asc`,
    );
    return rows;
  });
}
