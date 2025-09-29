const BASE_URL = import.meta.env.VITE_BFF_URL ?? 'http://localhost:4000'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  postOrders: (count: number) =>
    http<{ accepted: boolean; count: number }>(`/orders`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    }),
  getRecipes: () => http<import('@/types/api').GetRecipesResponse>(`/recipes`),
  getInventory: () => http<import('@/types/api').GetInventoryResponse>(`/inventory`),
  getReservations: (params: import('@/types/api').ReservationsQueryParams) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]) as [string, string][],
    )
    return http<import('@/types/api').GetReservationsResponseWire>(`/reservations?${qs}`)
  },
  getReservationDetail: (plateId: string) =>
    http<import('@/types/api').GetReservationDetailResponseWire>(`/reservations/${plateId}`),
  getPurchases: (params: import('@/types/api').PurchasesQueryParams) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]) as [string, string][],
    )
    return http<import('@/types/api').GetPurchasesResponseWire>(`/purchases?${qs}`)
  },
  getStatsSummary: () => http<import('@/types/api').GetStatsSummaryResponse>(`/stats/summary`),
}

export type ApiClient = typeof api
