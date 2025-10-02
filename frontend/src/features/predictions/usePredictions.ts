import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { predictionsApi } from './predictions.api';

export function usePredictions() {
  const summaryQuery = useQuery({
    queryKey: ['predictions', 'summary'],
    queryFn: predictionsApi.getSummary,
    refetchInterval: 15_000,
    retry: 1,
  });

  const latestQuery = useQuery({
    queryKey: ['predictions', 'latest'],
    queryFn: predictionsApi.getLatest,
    refetchInterval: 30_000,
    enabled: computed(() => summaryQuery.data?.value?.available === true),
    retry: 1,
  });

  return {
    summary: computed(() => summaryQuery.data?.value),
    latest: computed(() => latestQuery.data?.value),
    isLoading: computed(() => summaryQuery.isLoading.value),
    isAvailable: computed(() => summaryQuery.data?.value?.available === true),
  };
}
