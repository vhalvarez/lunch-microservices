import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';
import { ordersApi } from './orders.api';

export function useOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders', { limit: 200, offset: 0 }],
    queryFn: () => ordersApi.getAll({ limit: 200, offset: 0 }),
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
    onError: (err: any) => {
      let message = 'Error desconocido';

      // Intentar extraer mensaje amigable de Zod/Backend
      if (err.apiData?.error && Array.isArray(err.apiData.error)) {
        // Formato Zod: [{"message": "...", "path": [...]}]
        message = err.apiData.error.map((e: any) => e.message).join(', ');
      } else if (err.apiData?.message) {
        // Formato estándar { message: "..." }
        message = err.apiData.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      toast.error('Error al crear órdenes', {
        description: message,
      });
    },
  });

  return {
    orders: computed(() => ordersQuery.data?.value?.data ?? []),
    isLoading: computed(() => ordersQuery.isLoading.value),
    createOrders: (count: number) => createMutation.mutate(count),
    isCreating: computed(() => createMutation.isPending.value),
  };
}
