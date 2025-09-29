import { Ingredient, type Item } from '@lunch/shared-kernel';
import type { Recipe } from '@lunch/recipes';

export type PantryItem = { ingredient: Ingredient; qty: number };

export type Preferences = {
  likes?: Ingredient[];
  dislikes?: Ingredient[];
  // Futuro: restricciones dietarias, alergias, etc.
};

export type Recommendation = {
  recipe: Recipe;
  score: number; // mayor es mejor
  coverage: number; // [0-1] porcentaje de ingredientes cubiertos con el inventario
  missing: Item[]; // ingredientes faltantes con cantidades
};

export type RecommendOptions = {
  k?: number; // top-k
  weights?: {
    coverage: number; // peso de tener ingredientes disponibles
    missingPenalty: number; // penalización por ingredientes faltantes
    likeBonus: number; // bonus por gustos
    dislikePenalty: number; // penalización dura por ingredientes prohibidos
  };
};
