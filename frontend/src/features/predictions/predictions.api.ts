import { http } from '@/shared/lib/http';
import type { PredictionSummary, PredictionQuickSummary } from '@/shared/types';

export const predictionsApi = {
  async getSummary(): Promise<PredictionQuickSummary> {
    const { data } = await http.get<PredictionQuickSummary>('/predictions/summary');
    return data;
  },

  async getLatest(): Promise<PredictionSummary> {
    const { data } = await http.get<PredictionSummary>('/predictions/latest');
    return data;
  },
};
