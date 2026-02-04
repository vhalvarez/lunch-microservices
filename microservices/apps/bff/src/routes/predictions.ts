import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { PredictionsRepository } from '../repositories/predictions.repo.js';
import { PredictionsService } from '../core/predictions.service.js';

export function registerPredictionRoutes(router: FastifyInstance, ctx: RouteContext) {
  const repo = new PredictionsRepository(ctx.pool);
  const service = new PredictionsService(repo);

  router.get('/predictions/latest', async (req, reply) => {
    try {
      const result = await service.getLatestPrediction();
      if (!result) {
        return reply.status(404).send({ error: 'No predictions available yet' });
      }
      return result;
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get latest prediction');
      return reply.status(500).send({ error: 'Failed to retrieve prediction' });
    }
  });

  const AlertsQuerySchema = z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  });

  router.get('/predictions/alerts', async (req, reply) => {
    const parsed = AlertsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    try {
      const alerts = await service.getAlerts(parsed.data.severity);
      return { alerts };
    } catch (error) {
      ctx.log.error({ error, severity: parsed.data.severity }, 'Failed to get alerts');
      return reply.status(500).send({ error: 'Failed to retrieve alerts' });
    }
  });

  router.get('/predictions/consumption-analysis', async (req, reply) => {
    try {
      const analysis = await service.getConsumptionAnalysis();
      return { analysis };
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get consumption analysis');
      return reply.status(500).send({ error: 'Failed to retrieve consumption analysis' });
    }
  });

  router.get('/predictions/purchase-analysis', async (req, reply) => {
    try {
      const analysis = await service.getPurchaseAnalysis();
      return { analysis };
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get purchase analysis');
      return reply.status(500).send({ error: 'Failed to retrieve purchase analysis' });
    }
  });

  router.get('/predictions/summary', async (req, reply) => {
    try {
      return await service.getSummary();
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get predictions summary');
      return {
        available: false,
        message: 'Predictions not available',
      };
    }
  });
}
