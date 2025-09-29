export const INGREDIENTS = [
  'tomato',
  'lemon',
  'potato',
  'rice',
  'ketchup',
  'lettuce',
  'onion',
  'cheese',
  'meat',
  'chicken',
] as const;
export type Ingredient = typeof INGREDIENTS[number];

export type Item = {
  ingredient: Ingredient;
  qty: number; // >=0
};

export type Recipe = {
  name: string;
  items: Item[];
};

export type ReservationStatus = 'pending' | 'reserved' | 'failed';

// -----------------------------
// Contratos BFF (wire types)
// -----------------------------

// POST /orders
export interface PostOrdersRequest {
  count: number; // entero positivo
}
export interface PostOrdersResponse {
  accepted: boolean;
  count: number;
}

// GET /recipes
export type GetRecipesResponse = Recipe[];

// GET /inventory
export type InventoryRow = {
  ingredient: Ingredient;
  qty: number;
};
export type GetInventoryResponse = InventoryRow[];

// GET /reservations (lista paginada)
export interface ReservationsQueryParams {
  status?: ReservationStatus;
  prepared?: boolean;
  plateId?: string; 
  limit?: number;
  offset?: number; 
}

export type ReservationListRowWire = {
  plate_id: string; 
  status: ReservationStatus;
  created_at: string; 
  prepared_at: string | null; 
  isPrepared: boolean;
};
export interface GetReservationsResponseWire {
  total: number;
  limit: number;
  offset: number;
  data: ReservationListRowWire[];
}

// GET /reservations/:plateId (detalle)
export type ReservationItemWire = {
  ingredient: Ingredient;
  needed: number;
  reserved: number;
};
export type ReservationPurchaseWire = {
  id: string;
  ingredient: Ingredient;
  qty_requested: number;
  quantity_sold: number;
  created_at: string; 
};
export interface GetReservationDetailResponseWire {
  plate_id: string; 
  status: ReservationStatus;
  created_at: string;
  prepared_at: string | null; 
  retry_count: number | null;
  isPrepared: boolean;
  items: ReservationItemWire[];
  purchases: ReservationPurchaseWire[];
}

// GET /purchases (lista paginada)
export interface PurchasesQueryParams {
  plateId?: string; 
  ingredient?: Ingredient;
  limit?: number; 
  offset?: number; 
}
export type PurchaseListRowWire = {
  id: string;
  plate_id: string;
  ingredient: Ingredient;
  qty_requested: number;
  quantity_sold: number;
  created_at: string; 
};
export interface GetPurchasesResponseWire {
  total: number;
  limit: number;
  offset: number;
  data: PurchaseListRowWire[];
}

// GET /stats/summary
export type StatsSummaryReservations = {
  pending: number;
  reserved: number;
  failed: number;
  prepared: number;
};
export interface GetStatsSummaryResponse {
  reservations: StatsSummaryReservations;
  stock: InventoryRow[];
}

// ---------------------------------
// Tipos para la UI 
// ---------------------------------
export type ReservationListRow = {
  plateId: string;
  status: ReservationStatus;
  createdAt: string;
  preparedAt: string | null;
  isPrepared: boolean;
};
export function mapReservationListRow(w: ReservationListRowWire): ReservationListRow {
  return {
    plateId: w.plate_id,
    status: w.status,
    createdAt: w.created_at,
    preparedAt: w.prepared_at,
    isPrepared: w.isPrepared,
  };
}
export function mapReservationsResponse(
  w: GetReservationsResponseWire,
): { total: number; limit: number; offset: number; data: ReservationListRow[] } {
  return {
    total: w.total,
    limit: w.limit,
    offset: w.offset,
    data: w.data.map(mapReservationListRow),
  };
}

export type ReservationDetail = {
  plateId: string;
  status: ReservationStatus;
  createdAt: string;
  preparedAt: string | null;
  retryCount: number | null;
  isPrepared: boolean;
  items: { ingredient: Ingredient; needed: number; reserved: number }[];
  purchases: {
    id: string;
    ingredient: Ingredient;
    qtyRequested: number;
    quantitySold: number;
    createdAt: string;
  }[];
};
export function mapReservationDetail(w: GetReservationDetailResponseWire): ReservationDetail {
  return {
    plateId: w.plate_id,
    status: w.status,
    createdAt: w.created_at,
    preparedAt: w.prepared_at,
    retryCount: w.retry_count,
    isPrepared: w.isPrepared,
    items: w.items.map((it) => ({ ...it })),
    purchases: w.purchases.map((p) => ({
      id: p.id,
      ingredient: p.ingredient,
      qtyRequested: p.qty_requested,
      quantitySold: p.quantity_sold,
      createdAt: p.created_at,
    })),
  };
}

export type PurchaseListRow = {
  id: string;
  plateId: string;
  ingredient: Ingredient;
  qtyRequested: number;
  quantitySold: number;
  createdAt: string;
};
export function mapPurchaseRow(w: PurchaseListRowWire): PurchaseListRow {
  return {
    id: w.id,
    plateId: w.plate_id,
    ingredient: w.ingredient,
    qtyRequested: w.qty_requested,
    quantitySold: w.quantity_sold,
    createdAt: w.created_at,
  };
}
export function mapPurchasesResponse(
  w: GetPurchasesResponseWire,
): { total: number; limit: number; offset: number; data: PurchaseListRow[] } {
  return {
    total: w.total,
    limit: w.limit,
    offset: w.offset,
    data: w.data.map(mapPurchaseRow),
  };
}
