import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { kitchenApi } from './kitchen.api';

export function useKitchenStats() {
  const statsQuery = useQuery({
    queryKey: ['kitchen', 'stats'],
    queryFn: kitchenApi.getStats,
    refetchInterval: 1000,
  });

  const timingsQuery = useQuery({
    queryKey: ['kitchen', 'timings'],
    queryFn: kitchenApi.getTimings,
    refetchInterval: 1000,
  });

  return {
    stats: computed(() => statsQuery.data?.value),
    timings: computed(() => timingsQuery.data?.value),
    isLoading: computed(() => statsQuery.isLoading.value),
  };
}
