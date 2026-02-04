import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { kitchenApi } from './kitchen.api';

export function useKitchenStats() {
  const statsQuery = useQuery({
    queryKey: ['kitchen', 'stats'],
    queryFn: kitchenApi.getStats,
  });

  const timingsQuery = useQuery({
    queryKey: ['kitchen', 'timings'],
    queryFn: kitchenApi.getTimings,
  });

  const marketLogsQuery = useQuery({
    queryKey: ['kitchen', 'market-logs'],
    queryFn: kitchenApi.getMarketLogs,
    refetchInterval: 5000, // Refresh every 5s
  });

  const trafficQuery = useQuery({
    queryKey: ['kitchen', 'traffic'],
    queryFn: kitchenApi.getTrafficStats,
    refetchInterval: 30000,
  });

  const efficiencyQuery = useQuery({
    queryKey: ['kitchen', 'efficiency'],
    queryFn: kitchenApi.getEfficiencyStats,
    refetchInterval: 10000,
  });

  return {
    stats: computed(() => statsQuery.data?.value),
    timings: computed(() => timingsQuery.data?.value),
    marketLogs: computed(() => marketLogsQuery.data?.value ?? []),
    traffic: computed(() => trafficQuery.data?.value ?? []),
    efficiency: computed(() => efficiencyQuery.data?.value),
    isLoading: computed(() => statsQuery.isLoading.value),
  };
}
