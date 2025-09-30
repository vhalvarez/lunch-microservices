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

  const timingsQ = useQuery({
    queryKey: ["stats", "timings"],
    queryFn: () => api.getStatsTimings(),
    refetchInterval: 1000,
  });

  const purchasesQ = useQuery({
    queryKey: ["stats", "purchases"],
    queryFn: () => api.getStatsPurchases(),
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  });

  const totalIngredientsPurchased = computed(() => {
    const rows = purchasesQ.data?.value ?? [];
    // suma “sold” por ingrediente (ya viene agregado por el endpoint)
    return rows.reduce((acc, r) => acc + Number(r.sold ?? 0), 0);
  });

  const startOrdersMu = useMutation({
    mutationFn: async (count: number) => api.postOrders(count),
    onSuccess: async (data) => {
      console.log('Success toast being called');
      toast.success(`Se iniciaron ${data?.count ?? 0} platos para preparar`, {
        description: "Órdenes creadas exitosamente"
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["stats", "summary"] }),
        qc.invalidateQueries({ queryKey: ["inventory"] }),
        qc.invalidateQueries({ queryKey: ["reservations"] }),
      ]);
    },
    onError: (err: unknown) => {
      console.log('Error toast being called');
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error("Error al crear órdenes", {
        description: message
      });
    },
  });

  const hasActiveWork = computed(() => {
    const s = (statsQ.data?.value ?? {
      reservations: { pending: 0, reserved: 0, prepared: 0 },
    }) as GetStatsSummaryResponse;
    const pending = s.reservations.pending ?? 0;
    const inProgress = Math.max(
      (s.reservations.reserved ?? 0) - (s.reservations.prepared ?? 0),
      0
    );
    return pending > 0 || inProgress > 0;
  });

  const isProcessing = computed(() => {
    const p = (startOrdersMu as any).isPending?.value ?? false;
    const l = (startOrdersMu as any).isLoading?.value ?? false;
    return Boolean(p || l || hasActiveWork.value);
  });

  function startOrders(count: number) {
    return startOrdersMu.mutate(count);
  }

  const stats = computed(() => {
    const s = (statsQ.data?.value ?? {
      reservations: { pending: 0, reserved: 0, failed: 0, prepared: 0 },
      stock: [],
    }) as GetStatsSummaryResponse;
    const { pending, reserved, prepared, failed } = s.reservations;

    return {
      totalPlatesOrdered: pending + reserved + failed,
      platesCompleted: prepared,
      platesInProgress: Math.max(reserved - prepared, 0),
      platesFailed: failed,
      totalIngredientsPurchased: totalIngredientsPurchased.value,
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

  const avgSeconds = computed(() =>
    Number(timingsQ.data?.value?.avgSeconds ?? 0)
  );
  const p95Seconds = computed(() =>
    Number(timingsQ.data?.value?.p95Seconds ?? 0)
  );
  const timingsCount = computed(() => Number(timingsQ.data?.value?.count ?? 0));

  return {
    stats: stats,
    inventory: inventory,
    orders: orders,
    isProcessing,
    startOrders,
    avgSeconds,
    p95Seconds,
    timingsCount,
  };
}
