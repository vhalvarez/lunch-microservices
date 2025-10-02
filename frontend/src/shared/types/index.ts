export type OrderStatus = 'pending' | 'cooking' | 'completed' | 'failed';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  cooking: 'Cocinando',
  completed: 'Completado',
  failed: 'Fallido',
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  completed: 'bg-gray-900 text-white',
  cooking: 'bg-gray-200 text-gray-800',
  failed: 'bg-red-100 text-red-700 border border-red-200',
  pending: 'bg-white text-gray-800 border',
};

export type IngredientName =
  | 'tomato'
  | 'lemon'
  | 'potato'
  | 'rice'
  | 'ketchup'
  | 'lettuce'
  | 'onion'
  | 'cheese'
  | 'meat'
  | 'chicken';

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
}

export interface Ingredient {
  name: IngredientName;
  quantity: number;
}

export interface KitchenStats {
  totalPlatesOrdered: number;
  platesCompleted: number;
  platesInProgress: number;
  platesFailed: number;
  totalIngredientsPurchased: number;
}

export interface OrderDetail {
  plateId: string;
  status: OrderStatus;
  createdAt: string;
  preparedAt: string | null;
  retryCount: number | null;
  isPrepared: boolean;
  items: {
    ingredient: IngredientName;
    needed: number;
    reserved: number;
  }[];
  purchases: {
    id: string;
    ingredient: IngredientName;
    qtyRequested: number;
    quantitySold: number;
    createdAt: string;
  }[];
}

export interface Recipe {
  name: string;
  items: {
    ingredient: IngredientName;
    qty: number;
  }[];
}

export type AlertType = 'high_demand' | 'market_unreliable' | 'frequent_purchases' | 'potential_bottleneck' | 'ai_prediction';

export type PredictionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PredictionAlert {
  ingredient: string;
  alertType: AlertType;
  currentStock: number;
  severity: PredictionSeverity;
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

export interface PredictionQuickSummary {
  available: boolean;
  generatedAt?: string;
  totalAlerts?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  message?: string;
}

export const SEVERITY_COLORS: Record<PredictionSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

export const SEVERITY_LABELS: Record<PredictionSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};
