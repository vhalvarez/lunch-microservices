import { http } from '@/shared/lib/http';
import type { Ingredient, IngredientName } from '@/shared/types';

interface InventoryResponse {
  ingredient: IngredientName;
  qty: number;
}

export const inventoryApi = {
  async getAll(): Promise<Ingredient[]> {
    const { data } = await http.get<InventoryResponse[]>('/inventory');
    return data.map((item) => ({
      name: item.ingredient,
      quantity: item.qty,
    }));
  },
};
