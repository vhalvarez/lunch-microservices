import { z } from 'zod';
import type { Ingredient } from '@lunch/shared-kernel';

/**
 * Análisis de consumo y compras por ingrediente
 * Enfocado en la dinámica bodega -> compra -> uso
 */
export interface ConsumptionAnalysis {
  ingredient: Ingredient;
  currentStock: number;
  averageConsumptionPerOrder: number;  
  standardDeviation: number;
  totalConsumed: number;
  totalOrders: number;
  analysisWindowOrders: number;
}

/**
 * Análisis de compras en el mercado
 */
export interface PurchaseAnalysis {
  ingredient: Ingredient;
  totalPurchaseAttempts: number;  
  successfulPurchases: number;    
  failedPurchases: number;        
  successRate: number;            
  totalQuantityRequested: number;
  totalQuantityReceived: number;
  averageQuantityPerPurchase: number;
  lastPurchaseAt: Date | null;
}

/**
 * Alerta inteligente basada en patrones reales
 * No predice "escasez" sino problemas operacionales
 */
export interface SmartAlert {
  ingredient: Ingredient;
  alertType: 'high_demand' | 'market_unreliable' | 'frequent_purchases' | 'potential_bottleneck' | 'ai_prediction';
  currentStock: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  
  // Métricas específicas
  ordersUsingThisIngredient: number;  
  purchaseFrequency: number;  
  marketSuccessRate: number; 
  
  // Recomendación
  recommendedMinStock: number; 
  reason: string;
  actionable: string; 
}

/**
 * Tendencia de consumo
 */
export interface ConsumptionTrend {
  ingredient: Ingredient;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendStrength: number; // 0-1
  forecastNext10Orders: number;
  forecastNext50Orders: number;
  forecastNext100Orders: number;
}

/**
 * Resultado completo de predicción
 */
export interface PredictionResult {
  generatedAt: Date;
  analysisWindowOrders: number;
  totalOrdersAnalyzed: number;
  alerts: SmartAlert[];
  consumptionAnalysis: ConsumptionAnalysis[];
  purchaseAnalysis: PurchaseAnalysis[];
  trends: ConsumptionTrend[];
}

/**
 * Datos históricos de consumo
 */
export interface HistoricalConsumption {
  ingredient: Ingredient;
  timestamp: Date;
  quantityConsumed: number;
  currentStock: number;
}

/**
 * Datos de compras en mercado
 */
export interface MarketPurchase {
  ingredient: Ingredient;
  timestamp: Date;
  quantityRequested: number;
  quantitySold: number;
  plateId?: string;
}

/**
 * Configuración del predictor
 */
export interface PredictorConfig {
  analysisWindowOrders: number; 
  minDataPoints: number;  
  
  // Thresholds para alertas
  highDemandThreshold: number;  
  frequentPurchaseThreshold: number;  
  lowMarketSuccessThreshold: number;  
  
  confidenceThreshold: number; 
  safetyStockMultiplier: number;  
}

// Schemas de validación
export const ConsumptionAnalysisSchema = z.object({
  ingredient: z.string(),
  currentStock: z.number(),
  averageConsumptionPerOrder: z.number(),
  standardDeviation: z.number(),
  totalConsumed: z.number(),
  totalOrders: z.number(),
  analysisWindowOrders: z.number(),
});

export const PurchaseAnalysisSchema = z.object({
  ingredient: z.string(),
  totalPurchaseAttempts: z.number(),
  successfulPurchases: z.number(),
  failedPurchases: z.number(),
  successRate: z.number().min(0).max(100),
  totalQuantityRequested: z.number(),
  totalQuantityReceived: z.number(),
  averageQuantityPerPurchase: z.number(),
  lastPurchaseAt: z.string().nullable(),
});

export const SmartAlertSchema = z.object({
  ingredient: z.string(),
  alertType: z.enum(['high_demand', 'market_unreliable', 'frequent_purchases', 'potential_bottleneck', 'ai_prediction']),
  currentStock: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(100),
  ordersUsingThisIngredient: z.number().min(0).max(100),
  purchaseFrequency: z.number(),
  marketSuccessRate: z.number().min(0).max(100),
  recommendedMinStock: z.number(),
  reason: z.string(),
  actionable: z.string(),
});

export const ConsumptionTrendSchema = z.object({
  ingredient: z.string(),
  trend: z.enum(['increasing', 'stable', 'decreasing']),
  trendStrength: z.number().min(0).max(1),
  forecastNext10Orders: z.number(),
  forecastNext50Orders: z.number(),
  forecastNext100Orders: z.number(),
});

export const PredictionResultSchema = z.object({
  generatedAt: z.string(),
  analysisWindowOrders: z.number(),
  totalOrdersAnalyzed: z.number(),
  alerts: z.array(SmartAlertSchema),
  consumptionAnalysis: z.array(ConsumptionAnalysisSchema),
  purchaseAnalysis: z.array(PurchaseAnalysisSchema),
  trends: z.array(ConsumptionTrendSchema),
});
