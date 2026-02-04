import type { FastifyInstance } from 'fastify';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { InventoryRepository } from '../repositories/inventory.repo.js';
import { InventoryService } from '../core/inventory.service.js';

export function registerInventoryRoutes(router: FastifyInstance, ctx: RouteContext) {
  const repo = new InventoryRepository(ctx.pool);
  const service = new InventoryService(repo);

  router.get('/inventory', async () => {
    return service.getStock();
  });
}
