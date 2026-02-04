import type { FastifyInstance } from 'fastify';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { StatsRepository } from '../repositories/stats.repo.js';
import { StatsService } from '../core/stats.service.js';

export function registerStatsRoutes(router: FastifyInstance, ctx: RouteContext) {
  const repo = new StatsRepository(ctx.pool);
  const service = new StatsService(repo);

  router.get('/stats/summary', async () => {
    return service.getSummary();
  });

  router.get('/stats/purchases', async () => {
    return service.getPurchases();
  });

  router.get('/stats/timings', async () => {
    return service.getTimings();
  });

  router.get('/stats/market-logs', async () => {
    return service.getMarketLogs();
  });

  router.get('/stats/traffic', async () => {
    return service.getTrafficStats();
  });

  router.get('/stats/efficiency', async () => {
    return service.getEfficiencyStats();
  });
}
