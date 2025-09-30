import type {
  GetInventoryResponse,
  GetPurchasesResponseWire,
  GetRecipesResponse,
  GetReservationDetailResponseWire,
  GetReservationsResponseWire,
  GetStatsSummaryResponse,
  PurchasesQueryParams,
  ReservationsQueryParams,
} from "@/types/api";
import { lunchApi } from "./axios";

export const api = {
  postOrders: async (count: number) => {
    const { data } = await lunchApi.post<{ accepted: boolean; count: number }>(
      `/orders`,
      { count }
    );
    return data;
  },

  getRecipes: async () =>
    (await lunchApi.get<GetRecipesResponse>(`/recipes`)).data,

  getInventory: async () =>
    (await lunchApi.get<GetInventoryResponse>(`/inventory`)).data,

  getReservations: async (params: ReservationsQueryParams) => {
    const { data } = await lunchApi.get<GetReservationsResponseWire>(
      `/reservations`,
      { params }
    );
    return data;
  },

  getReservationDetail: async (plateId: string) =>
    (
      await lunchApi.get<GetReservationDetailResponseWire>(
        `/reservations/${plateId}`
      )
    ).data,

  getPurchases: async (params: PurchasesQueryParams) =>
    (await lunchApi.get<GetPurchasesResponseWire>(`/purchases`, { params }))
      .data,

  getStatsSummary: async () =>
    (await lunchApi.get<GetStatsSummaryResponse>(`/stats/summary`)).data,

  getStatsTimings: async () =>
    (
      await lunchApi.get<{
        avgSeconds: number;
        p95Seconds: number;
        count: number;
      }>(`/stats/timings`)
    ).data,

  getStatsPurchases: async () =>
    (
      await lunchApi.get<
        Array<{
          ingredient: string;
          attempts: number;
          requested: number;
          sold: number;
          lastAt: string;
        }>
      >("/stats/purchases")
    ).data,
};

export type ApiClient = typeof api;
