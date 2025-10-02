import type { FastifyInstance } from 'fastify';

export function registerHealthRoutes(router: FastifyInstance) {
  router.get('/health', async () => ({ ok: true }));
}
