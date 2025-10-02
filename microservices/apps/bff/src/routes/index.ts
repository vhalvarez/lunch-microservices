import type { FastifyInstance } from 'fastify';
import type { RouteContext } from '../interfaces/routes.interface.js';

import { registerHealthRoutes } from './health.js';
import { registerOrderRoutes } from './orders.js';
import { registerRecipeRoutes } from './recipes.js';
import { registerInventoryRoutes } from './inventory.js';
import { registerReservationRoutes } from './reservations.js';
import { registerPurchaseRoutes } from './purchases.js';
import { registerStatsRoutes } from './stats.js';
import { registerPredictionRoutes } from './predictions.js';

export function registerRoutes(router: FastifyInstance, ctx: RouteContext) {
  registerHealthRoutes(router);
  registerOrderRoutes(router, ctx);
  registerRecipeRoutes(router);
  registerInventoryRoutes(router, ctx);
  registerReservationRoutes(router, ctx);
  registerPurchaseRoutes(router, ctx);
  registerStatsRoutes(router, ctx);
  registerPredictionRoutes(router, ctx);
}
