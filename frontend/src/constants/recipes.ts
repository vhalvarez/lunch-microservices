export interface RecipeDef {
  name: string;
  ingredients: string; // Display string
  items: string[]; // Array for checking against market
  image: string;
  color: string;
  type: 'Appetizers' | 'Entrees';
}

export const RECIPES_LIST: RecipeDef[] = [
  {
    name: 'Arroz con Pollo',
    ingredients: 'Chicken, Rice, Onion',
    items: ['chicken', 'rice', 'onion'],
    image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=400&q=80',
    color: 'from-orange-500/20 to-orange-500/0',
    type: 'Entrees'
  },
  {
    name: 'Pizza',
    ingredients: 'Cheese, Tomato, Dough',
    items: ['cheese', 'tomato', 'potato'], // Dough -> potato for simplicity? or just mock
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    color: 'from-red-500/20 to-red-500/0',
    type: 'Entrees'
  },
  {
    name: 'Caesar Salad',
    ingredients: 'Lettuce, Chicken, Croutons',
    items: ['lettuce', 'chicken', 'cheese'],
    image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=400&q=80',
    color: 'from-green-500/20 to-green-500/0',
    type: 'Appetizers'
  },
  {
    name: 'Tomato Soup',
    ingredients: 'Tomato, Cream, Basil',
    items: ['tomato', 'cheese'], // Cream -> cheese
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
    color: 'from-red-600/20 to-red-600/0',
    type: 'Appetizers'
  },
  {
    name: 'Healthy Bowl',
    ingredients: 'Spinach, Quinoa, Lemon',
    items: ['lettuce', 'rice', 'lemon'],
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80',
    color: 'from-emerald-500/20 to-emerald-500/0',
    type: 'Appetizers'
  },
  {
    name: 'Fried Chicken',
    ingredients: 'Chicken, Oil, Potato',
    items: ['chicken', 'potato'],
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80',
    color: 'from-yellow-500/20 to-yellow-500/0',
    type: 'Entrees'
  }
];

export const RECIPES_MAP = RECIPES_LIST.reduce((acc, recipe) => {
  acc[recipe.name] = recipe;
  return acc;
}, {} as Record<string, RecipeDef>);
