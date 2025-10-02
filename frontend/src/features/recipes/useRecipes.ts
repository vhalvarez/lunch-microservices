import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { recipesApi } from './recipes.api';

export function useRecipes() {
  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.getAll,
    staleTime: 60_000,
  });

  return {
    recipes: computed(() => recipesQuery.data?.value ?? []),
    isLoading: computed(() => recipesQuery.isLoading.value),
  };
}
