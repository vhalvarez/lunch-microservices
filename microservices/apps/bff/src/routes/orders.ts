import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  Exchanges,
  RoutingKeys,
  type OrderCreateRequested,
} from '@lunch/shared-kernel';

import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerOrderRoutes(router: FastifyInstance, ctx: RouteContext) {
  const Body = z.object({ count: z.number().int().positive() });

  router.post('/orders', async (req, reply) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const payload: OrderCreateRequested = {
      messageId: randomUUID(),
      count: parsed.data.count,
    };

    await ctx.bus.publish(Exchanges.order, RoutingKeys.orderCreateRequested, payload);

    return reply.code(202).send({ accepted: true, count: parsed.data.count });
  });
}
