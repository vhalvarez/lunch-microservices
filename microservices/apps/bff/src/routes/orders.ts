import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RouteContext } from '../interfaces/routes.interface.js';
import { OrdersService } from '../core/orders.service.js';

export function registerOrderRoutes(router: FastifyInstance, ctx: RouteContext) {
  const service = new OrdersService(ctx.bus);

  // Validación con límite máximo de 1000 órdenes por request
  const Body = z.object({
    count: z.number().int().positive().max(1000, 'Maximum 1000 orders per request')
  });

  router.post('/orders', {
    config: {
      rateLimit: {
        max: 10,              // 10 requests
        timeWindow: '1 minute' // por minuto (más estricto que el global)
      }
    }
  }, async (req, reply) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const result = await service.createOrders(parsed.data.count);

    return reply.code(202).send(result);
  });
}
