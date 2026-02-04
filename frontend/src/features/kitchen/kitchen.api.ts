import { http } from '@/shared/lib/http';
import type { KitchenStats } from '@/shared/types';

interface StatsSummaryResponse {
  reservations: {
    pending: number;
    reserved: number;
    failed: number;
    prepared: number;
  };
  stock: any[];
}

interface StatsTimingsResponse {
  avgSeconds: number;
  p95Seconds: number;
  count: number;
}

interface StatsPurchasesResponse {
  ingredient: string;
  attempts: number;
  requested: number;
  sold: number;
  lastAt: string;
}

export interface TrafficStat {
  hour: string;
  count: number;
}

export interface EfficiencyStat {
  flowEfficiency: number;
  avgPrepTime: number;
  turnRate: number;
}

export const kitchenApi = {
  async getStats(): Promise<KitchenStats> {
    const [summaryRes, purchasesRes] = await Promise.all([
      http.get<StatsSummaryResponse>('/stats/summary'),
      http.get<StatsPurchasesResponse[]>('/stats/purchases'),
    ]);

    const { pending, reserved, prepared, failed } = summaryRes.data.reservations;
    const totalIngredientsPurchased = purchasesRes.data.reduce(
      (acc, p) => acc + Number(p.sold ?? 0),
      0
    );

    return {
      totalPlatesOrdered: pending + reserved + failed,
      platesCompleted: prepared,
      platesInProgress: Math.max(reserved - prepared, 0),
      platesFailed: failed,
      totalIngredientsPurchased,
    };
  },

  async getTimings(): Promise<StatsTimingsResponse> {
    const { data } = await http.get<StatsTimingsResponse>('/stats/timings');
    return data;
  },

  async getMarketLogs(): Promise<any[]> {
    const { data } = await http.get<any[]>('/stats/market-logs');
    return data;
  },

  async getTrafficStats(): Promise<TrafficStat[]> {
    const { data } = await http.get<TrafficStat[]>('/stats/traffic');
    return data;
  },

  async getEfficiencyStats(): Promise<EfficiencyStat> {
    const { data } = await http.get<EfficiencyStat>('/stats/efficiency');
    return data;
  },
};
