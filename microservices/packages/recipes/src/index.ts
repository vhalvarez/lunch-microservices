import { z } from 'zod';
import { Ingredient, Item as ItemSchema, type Item } from '@lunch/shared-kernel';

/** Tipo de receta reutilizable en BFF y order-svc */
export type Recipe = {
  name: string;
  items: Item[];
};

export const RecipeSchema = z.object({
  name: z.string().min(1),
  items: z.array(ItemSchema).min(1),
});

/** Catálogo de recetas */
export const RECIPES: readonly Recipe[] = [
  {
    name: 'Chicken Rice',
    items: [
      { ingredient: 'chicken', qty: 1 },
      { ingredient: 'rice', qty: 2 },
      { ingredient: 'onion', qty: 1 },
      { ingredient: 'lemon', qty: 1 },
    ],
  },
  {
    name: 'Meat & Potatoes',
    items: [
      { ingredient: 'meat', qty: 1 },
      { ingredient: 'potato', qty: 3 },
      { ingredient: 'onion', qty: 1 },
    ],
  },
  {
    name: 'Cheesy Lettuce Wrap',
    items: [
      { ingredient: 'cheese', qty: 1 },
      { ingredient: 'lettuce', qty: 2 },
      { ingredient: 'tomato', qty: 1 },
    ],
  },
  {
    name: 'Tomato Rice Bowl',
    items: [
      { ingredient: 'rice', qty: 2 },
      { ingredient: 'tomato', qty: 2 },
      { ingredient: 'onion', qty: 1 },
    ],
  },
  {
    name: 'Chicken Salad',
    items: [
      { ingredient: 'chicken', qty: 1 },
      { ingredient: 'lettuce', qty: 2 },
      { ingredient: 'tomato', qty: 1 },
      { ingredient: 'lemon', qty: 1 },
    ],
  },
  {
    name: 'Meat Burger',
    items: [
      { ingredient: 'meat', qty: 1 },
      { ingredient: 'cheese', qty: 1 },
      { ingredient: 'ketchup', qty: 1 },
      { ingredient: 'onion', qty: 1 },
    ],
  },
] as const;

export function getRandomRecipe(): Recipe {
  const idx = (Math.random() * RECIPES.length) | 0;
  return RECIPES[idx];
}

export { Ingredient };
