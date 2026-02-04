import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { inventoryApi } from './inventory.api';

export function useInventory() {
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  });

  return {
    inventory: computed(() => inventoryQuery.data?.value ?? []),
    isLoading: computed(() => inventoryQuery.isLoading.value),
  };
}
