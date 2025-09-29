import { api } from "@/api/lunch";
import {
  mapReservationsResponse,
  type GetInventoryResponse,
  type GetReservationsResponseWire,
  type GetStatsSummaryResponse,
  type ReservationListRow,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { toast } from "vue-sonner";

export function useKitchenSystem() {
  const qc = useQueryClient();

  const statsQ = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: () => api.getStatsSummary(),
    refetchInterval: 1000,
  });

  const inventoryQ = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(),
    refetchInterval: 1000,
  });

  const reservationsQ = useQuery({
    queryKey: ["reservations", { limit: 10, offset: 0 }],
    queryFn: () => api.getReservations({ limit: 10, offset: 0 }),
    refetchInterval: 1000,
    select: (wire: GetReservationsResponseWire) =>
      mapReservationsResponse(wire),
  });

  const startOrdersMu = useMutation({
    mutationFn: async (count: number) => api.postOrders(count),
    onSuccess: async (data) => {
      toast({
        title: "Ordenes creadas",
        description: `Se iniciaron ${data?.count ?? 0} platos para preparar`,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["stats", "summary"] }),
        qc.invalidateQueries({ queryKey: ["inventory"] }),
        qc.invalidateQueries({ queryKey: ["reservations"] }),
      ]);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast({
        variant: "destructive",
        title: "Error al crear ordenes",
        description: message,
      });
    },
  });

  // Trabajo activo a partir de /stats/summary: pendientes o en progreso
  const hasActiveWork = computed(() => {
    const s = (statsQ.data?.value ?? { reservations: { pending: 0, reserved: 0, prepared: 0 } }) as GetStatsSummaryResponse
    const pending = s.reservations.pending ?? 0
    const inProgress = Math.max((s.reservations.reserved ?? 0) - (s.reservations.prepared ?? 0), 0)
    return pending > 0 || inProgress > 0
  })

  // El estado de procesamiento combina la mutación inmediata y el trabajo activo observado
  const isProcessing = computed(() => {
    // En @tanstack/vue-query, los flags son Refs; hay que leer .value
    const p = (startOrdersMu as any).isPending?.value ?? false
    const l = (startOrdersMu as any).isLoading?.value ?? false
    return Boolean(p || l || hasActiveWork.value)
  })

  function startOrders(count: number) {
    return startOrdersMu.mutate(count);
  }

  // Posible implementacion en BFF
  // async function resetSystem() {
  //   await Promise.all([
  //     qc.invalidateQueries({ queryKey: ["stats", "summary"] }),
  //     qc.invalidateQueries({ queryKey: ["inventory"] }),
  //     qc.invalidateQueries({ queryKey: ["reservations"] }),
  //   ]);
  // }

  const stats = computed(() => {
    const s = (statsQ.data?.value ?? {
      reservations: { pending: 0, reserved: 0, failed: 0, prepared: 0 },
      stock: [],
    }) as GetStatsSummaryResponse;
    const pending = s.reservations.pending;
    const reserved = s.reservations.reserved;
    const prepared = s.reservations.prepared;
    const failed = s.reservations.failed;

    return {
      totalPlatesOrdered: pending + reserved + failed,
      platesCompleted: prepared,
      platesInProgress: Math.max(reserved - prepared, 0),
      platesFailed: failed,
      totalIngredientsPurchased: 0,
    };
  });

  const inventory = computed(() => {
    const inv = (inventoryQ.data?.value ?? []) as GetInventoryResponse;
    return inv.map((r) => ({ ingredient: r.ingredient, quantity: r.qty }));
  });

  const orders = computed<
    Array<{
      id: string;
      createdAt: string;
      status: "pending" | "cooking" | "completed" | "failed";
    }>
  >(() => {
    const res = reservationsQ.data?.value?.data ?? ([] as ReservationListRow[]);

    interface Order {
      id: string;
      createdAt: string;
      status: "pending" | "cooking" | "completed" | "failed";
    }

    return res
      .map((r: ReservationListRow): Order => {
        let status: Order["status"] = "pending";
        if (r.status === "failed") status = "failed";
        else if (r.isPrepared) status = "completed";
        else if (r.status === "reserved") status = "cooking";
        else status = "pending";
        return { id: r.plateId, createdAt: r.createdAt, status };
      })
      .slice()
      .reverse();
  });

  return {
    stats: stats,
    inventory: inventory,
    orders: orders,
    isProcessing,
    startOrders,
  };
}
