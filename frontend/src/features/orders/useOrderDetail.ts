import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { ordersApi } from './orders.api';
import { recipesApi } from '../recipes/recipes.api';

export function useOrderDetail(plateId: Ref<string | null>) {
  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.getAll,
    staleTime: 60_000,
  });

  const detailQuery = useQuery({
    queryKey: ['orders', 'detail', () => plateId.value],
    queryFn: () => ordersApi.getDetail(plateId.value!),
    enabled: computed(() => Boolean(plateId.value)),
  });

  const recipeName = computed(() => {
    const detail = detailQuery.data?.value;
    const recipes = recipesQuery.data?.value;

    if (!detail || !recipes) return '—';

    const itemSet = new Set(detail.items.map((i) => i.ingredient));
    const match = recipes.find((recipe) => {
      const recipeSet = new Set(recipe.items.map((i) => i.ingredient));
      if (recipeSet.size !== itemSet.size) return false;
      for (const ing of recipeSet) {
        if (!itemSet.has(ing)) return false;
      }
      return true;
    });

    return match?.name ?? 'Receta desconocida';
  });

  const shortId = computed(() => {
    const id = plateId.value;
    return id ? id.split('-')[1] ?? id.slice(0, 6) : '—';
  });

  return {
    detail: computed(() => detailQuery.data?.value),
    recipeName,
    shortId,
    isLoading: computed(
      () => recipesQuery.isLoading.value || detailQuery.isLoading.value
    ),
    refetch: () => detailQuery.refetch(),
  };
}
