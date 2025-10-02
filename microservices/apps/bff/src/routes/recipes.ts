import type { FastifyInstance } from 'fastify';

import { RECIPES } from '@lunch/recipes';

export function registerRecipeRoutes(router: FastifyInstance) {
  router.get('/recipes', async () => RECIPES);
}
