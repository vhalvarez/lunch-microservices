import { describe, it, expect, vi, afterEach } from 'vitest';
import { RecipeSchema, RECIPES, getRandomRecipe, type Recipe, Ingredient } from '../index.js';

describe('Unit - Recipes: RecipeSchema', () => {
  it('debe validar receta correcta', () => {
    const validRecipe = {
      name: 'Test Recipe',
      items: [
        { ingredient: 'tomato', qty: 2 },
        { ingredient: 'cheese', qty: 1 },
      ],
    };

    const result = RecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('debe rechazar receta sin nombre', () => {
    const invalidRecipe = {
      name: '',
      items: [{ ingredient: 'tomato', qty: 2 }],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe rechazar receta sin items', () => {
    const invalidRecipe = {
      name: 'Test Recipe',
      items: [],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe rechazar item con qty negativa', () => {
    const invalidRecipe = {
      name: 'Test Recipe',
      items: [{ ingredient: 'tomato', qty: -1 }],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe rechazar item con qty cero', () => {
    const invalidRecipe = {
      name: 'Test Recipe',
      items: [{ ingredient: 'tomato', qty: 0 }],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe rechazar ingrediente inválido', () => {
    const invalidRecipe = {
      name: 'Test Recipe',
      items: [{ ingredient: 'pizza', qty: 1 }],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe validar receta con múltiples items', () => {
    const validRecipe = {
      name: 'Complex Recipe',
      items: [
        { ingredient: 'chicken', qty: 1 },
        { ingredient: 'rice', qty: 2 },
        { ingredient: 'onion', qty: 1 },
        { ingredient: 'lemon', qty: 1 },
      ],
    };

    const result = RecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('debe rechazar receta sin campo name', () => {
    const invalidRecipe = {
      items: [{ ingredient: 'tomato', qty: 2 }],
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('debe rechazar receta sin campo items', () => {
    const invalidRecipe = {
      name: 'Test Recipe',
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });
});

describe('Unit - Recipes: RECIPES constant', () => {
  it('debe contener 6 recetas', () => {
    expect(RECIPES).toHaveLength(6);
  });

  it('todas las recetas deben ser válidas según el schema', () => {
    RECIPES.forEach((recipe) => {
      const result = RecipeSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });
  });

  it('debe contener "Chicken Rice"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Chicken Rice');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(4);
  });

  it('debe contener "Meat & Potatoes"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Meat & Potatoes');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(3);
  });

  it('debe contener "Cheesy Lettuce Wrap"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Cheesy Lettuce Wrap');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(3);
  });

  it('debe contener "Tomato Rice Bowl"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Tomato Rice Bowl');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(3);
  });

  it('debe contener "Chicken Salad"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Chicken Salad');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(4);
  });

  it('debe contener "Meat Burger"', () => {
    const recipe = RECIPES.find((r) => r.name === 'Meat Burger');
    expect(recipe).toBeDefined();
    expect(recipe?.items).toHaveLength(4);
  });

  it('todas las recetas deben tener nombre único', () => {
    const names = RECIPES.map((r) => r.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(RECIPES.length);
  });

  it('todos los items deben tener qty positiva', () => {
    RECIPES.forEach((recipe) => {
      recipe.items.forEach((item) => {
        expect(item.qty).toBeGreaterThan(0);
      });
    });
  });

  it('todos los items deben tener ingredientes válidos', () => {
    RECIPES.forEach((recipe) => {
      recipe.items.forEach((item) => {
        const result = Ingredient.safeParse(item.ingredient);
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Unit - Recipes: getRandomRecipe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe retornar una receta del array RECIPES', () => {
    const recipe = getRandomRecipe();
    expect(RECIPES).toContainEqual(recipe);
  });

  it('debe retornar la primera receta cuando random es 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const recipe = getRandomRecipe();
    expect(recipe).toEqual(RECIPES[0]);
  });

  it('debe retornar la última receta cuando random está cerca de 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const recipe = getRandomRecipe();
    expect(recipe).toEqual(RECIPES[5]);
  });

  it('debe retornar una receta válida según el schema', () => {
    const recipe = getRandomRecipe();
    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it('debe retornar diferentes recetas en múltiples llamadas', () => {
    const recipes = new Set<Recipe>();

    // Obtener diferentes recetas
    for (let i = 0; i < 50; i++) {
      recipes.add(getRandomRecipe());
    }

    // Por lo menos 2 recetas distintas
    expect(recipes.size).toBeGreaterThan(1);
  });

  it('debe retornar receta en índice 2 cuando random es 0.4', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    const recipe = getRandomRecipe();
    expect(recipe).toEqual(RECIPES[2]);
  });

  it('debe retornar receta en índice 3 cuando random es 0.6', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);

    const recipe = getRandomRecipe();
    expect(recipe).toEqual(RECIPES[3]);
  });

  it('nunca debe retornar undefined', () => {
    for (let i = 0; i < 20; i++) {
      const recipe = getRandomRecipe();
      expect(recipe).toBeDefined();
    }
  });
});
