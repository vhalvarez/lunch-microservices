import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { marketApi, type MarketHistoryParams } from './market.api';

export function useMarketHistory() {
  const page = ref(1);
  const pageSize = ref(10); // Standard page size
  const status = ref<'success' | 'failed' | undefined>();

  const filters = computed<MarketHistoryParams>(() => ({
    limit: pageSize.value,
    offset: (page.value - 1) * pageSize.value,
    status: status.value
  }));

  function setStatus(newStatus: 'success' | 'failed' | undefined) {
    status.value = newStatus;
    page.value = 1; // Reset to page 1 when filter changes
  }

  const historyQuery = useQuery({
    queryKey: ['market', 'history', filters],
    queryFn: () => marketApi.getHistory(filters.value),
    refetchInterval: 10000,
  });

  const total = computed(() => historyQuery.data.value?.total ?? 0);
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  
  function setPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage;
    }
  }

  return {
    history: computed(() => historyQuery.data.value?.items || []),
    total,
    page,
    status,
    setStatus,
    totalPages,
    setPage,
    isLoading: computed(() => historyQuery.isLoading.value),
    refetch: historyQuery.refetch,
  };
}
