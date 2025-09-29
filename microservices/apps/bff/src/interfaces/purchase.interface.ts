    export interface PurchaseStatsRow {
      ingredient: string;
      attempts: string;
      requested: string;
      sold: string;
      last_at: string;
    }

    export interface PurchaseStats {
      ingredient: string;
      attempts: number;
      requested: number;
      sold: number;
      lastAt: string;
    }
