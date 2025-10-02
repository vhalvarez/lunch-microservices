export interface PredictionAlert {
  ingredient: string;
  alertType: 'high_demand' | 'market_unreliable' | 'frequent_purchases' | 'potential_bottleneck' | 'ai_prediction';
  currentStock: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  ordersUsingThisIngredient: number;
  purchaseFrequency: number;
  marketSuccessRate: number;
  recommendedMinStock: number;
  reason: string;
  actionable: string;
}

export interface PredictionSummary {
  generatedAt: string;
  analysisWindowOrders: number;
  totalOrdersAnalyzed: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  alerts: PredictionAlert[];
}

export interface ConsumptionAnalysisData {
  ingredient: string;
  currentStock: number;
  averageConsumptionPerOrder: number;
  standardDeviation: number;
  totalConsumed: number;
  totalOrders: number;
}

export interface PurchaseAnalysisData {
  ingredient: string;
  totalPurchaseAttempts: number;
  successfulPurchases: number;
  failedPurchases: number;
  successRate: number;
  totalQuantityRequested: number;
  totalQuantityReceived: number;
  averageQuantityPerPurchase: number;
  lastPurchaseAt: string | null;
}
