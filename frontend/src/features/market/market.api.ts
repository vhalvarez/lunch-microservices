import { http } from '@/shared/lib/http';

export interface MarketHistoryParams {
  limit?: number;
  offset?: number;
  ingredient?: string;
  plateId?: string;
  status?: 'success' | 'failed';
}

interface RawMarketHistoryItem {
  id: string;
  plate_id: string;
  ingredient: string;
  qty_requested: number;
  quantity_sold: number;
  created_at: string;
}

export interface MarketHistoryItem {
  id: string;
  plateId: string;
  ingredient: string;
  qtyRequested: number;
  quantitySold: number;
  createdAt: string;
}

export interface MarketHistoryResponse {
  items: MarketHistoryItem[];
  total: number;
}

export const marketApi = {
  async getHistory(params: MarketHistoryParams = {}): Promise<MarketHistoryResponse> {
    const { data } = await http.get<{ data: RawMarketHistoryItem[], total: number }>('/purchases', { params });
    const items = data.data.map(item => ({
      id: item.id,
      plateId: item.plate_id,
      ingredient: item.ingredient,
      qtyRequested: item.qty_requested,
      quantitySold: item.quantity_sold,
      createdAt: item.created_at
    }));
    
    return {
      items,
      total: data.total
    };
  }
};
