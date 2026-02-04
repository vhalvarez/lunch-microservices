import type { FastifyInstance } from 'fastify';
import { PurchasesQuery } from '@lunch/shared-kernel';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { PurchasesRepository } from '../repositories/purchases.repo.js';
import { PurchasesService } from '../core/purchases.service.js';
// Force reload for shared-kernel update
export function registerPurchaseRoutes(router: FastifyInstance, ctx: RouteContext) {
  const repo = new PurchasesRepository(ctx.pool);
  const service = new PurchasesService(repo);

  router.get('/purchases', async (req, reply) => {
    const parsed = PurchasesQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    try {
      return await service.searchPurchases(parsed.data);
    } catch (error) {
      ctx.log.error({ error }, 'Failed to search purchases');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
