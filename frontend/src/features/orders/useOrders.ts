import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { ordersApi } from './orders.api';

export function useOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders', { limit: 10, offset: 0 }],
    queryFn: () => ordersApi.getAll({ limit: 10, offset: 0 }),
    refetchInterval: 1000,
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (data) => {
      toast.success(`Se iniciaron ${data.count} platos para preparar`, {
        description: 'Órdenes creadas exitosamente',
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al crear órdenes', {
        description: message,
      });
    },
  });

  return {
    orders: computed(() => ordersQuery.data?.value ?? []),
    isLoading: computed(() => ordersQuery.isLoading.value),
    createOrders: (count: number) => createMutation.mutate(count),
    isCreating: computed(() => createMutation.isPending.value),
  };
}
