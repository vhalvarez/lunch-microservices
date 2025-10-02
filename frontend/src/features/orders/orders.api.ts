import { http } from '@/shared/lib/http';
import type { Order, OrderDetail } from '@/shared/types';

interface OrdersResponse {
  total: number;
  limit: number;
  offset: number;
  data: {
    plate_id: string;
    status: 'pending' | 'reserved' | 'failed';
    created_at: string;
    prepared_at: string | null;
    isPrepared: boolean;
  }[];
}

interface OrderDetailResponse {
  plate_id: string;
  status: 'pending' | 'reserved' | 'failed';
  created_at: string;
  prepared_at: string | null;
  retry_count: number | null;
  isPrepared: boolean;
  items: {
    ingredient: string;
    needed: number;
    reserved: number;
  }[];
  purchases: {
    id: string;
    ingredient: string;
    qty_requested: number;
    quantity_sold: number;
    created_at: string;
  }[];
}

function mapStatus(wireStatus: string, isPrepared: boolean): Order['status'] {
  if (wireStatus === 'failed') return 'failed';
  if (isPrepared) return 'completed';
  if (wireStatus === 'reserved') return 'cooking';
  return 'pending';
}

export const ordersApi = {
  async getAll(params: { limit: number; offset: number }): Promise<Order[]> {
    const { data } = await http.get<OrdersResponse>('/reservations', { params });
    return data.data.map((item) => ({
      id: item.plate_id,
      createdAt: item.created_at,
      status: mapStatus(item.status, item.isPrepared),
    }));
  },

  async getDetail(plateId: string): Promise<OrderDetail> {
    const { data } = await http.get<OrderDetailResponse>(`/reservations/${plateId}`);
    return {
      plateId: data.plate_id,
      status: mapStatus(data.status, data.isPrepared),
      createdAt: data.created_at,
      preparedAt: data.prepared_at,
      retryCount: data.retry_count,
      isPrepared: data.isPrepared,
      items: data.items.map((item) => ({
        ingredient: item.ingredient as any,
        needed: item.needed,
        reserved: item.reserved,
      })),
      purchases: data.purchases.map((p) => ({
        id: p.id,
        ingredient: p.ingredient as any,
        qtyRequested: p.qty_requested,
        quantitySold: p.quantity_sold,
        createdAt: p.created_at,
      })),
    };
  },

  async create(count: number): Promise<{ accepted: boolean; count: number }> {
    if (count <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    if (count > 1_000_000) {
      throw new Error('La cantidad máxima es 1,000,000');
    }

    const { data } = await http.post<{ accepted: boolean; count: number }>(
      '/orders',
      { count }
    );
    return data;
  },
};
