import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReservationsQuery } from '@lunch/shared-kernel';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { ReservationsRepository } from '../repositories/reservations.repo.js';
import { ReservationsService } from '../core/reservations.service.js';

export function registerReservationRoutes(router: FastifyInstance, ctx: RouteContext) {
  const repo = new ReservationsRepository(ctx.pool);
  const service = new ReservationsService(repo);

  router.get('/reservations', async (req, reply) => {
    const parsed = ReservationsQuery.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    try {
      return await service.searchReservations(parsed.data);
    } catch (error) {
      ctx.log.error({ error }, 'Failed to search reservations');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  const IdParam = z.object({ plateId: z.uuid() });

  router.get('/reservations/:plateId', async (req, reply) => {
    const parsed = IdParam.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues });

    try {
      const details = await service.getReservationDetails(parsed.data.plateId);
      if (!details) return reply.status(404).send({ error: 'not_found' });
      return details;
    } catch (error) {
      ctx.log.error({ error, plateId: parsed.data.plateId }, 'Failed to get reservation details');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
