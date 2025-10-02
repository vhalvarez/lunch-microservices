import { http } from '@/shared/lib/http';
import type { Recipe } from '@/shared/types';

export const recipesApi = {
  async getAll(): Promise<Recipe[]> {
    const { data } = await http.get<Recipe[]>('/recipes');
    return data;
  },
};
