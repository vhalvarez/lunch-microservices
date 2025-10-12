import { describe, it, expect } from 'vitest';
import {
  ConsumptionAnalysisSchema,
  PurchaseAnalysisSchema,
  SmartAlertSchema,
  ConsumptionTrendSchema,
  PredictionResultSchema,
} from '../types.js';

describe('Unit - RecommenderAI Types: ConsumptionAnalysisSchema', () => {
  it('debe validar análisis de consumo correcto', () => {
    const valid = {
      ingredient: 'tomato',
      currentStock: 100,
      averageConsumptionPerOrder: 2.5,
      standardDeviation: 0.5,
      totalConsumed: 250,
      totalOrders: 100,
      analysisWindowOrders: 50,
    };

    const result = ConsumptionAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe rechazar sin campo requerido', () => {
    const invalid = {
      ingredient: 'tomato',
      currentStock: 100,
      // averageConsumptionPerOrder
      standardDeviation: 0.5,
      totalConsumed: 250,
      totalOrders: 100,
      analysisWindowOrders: 50,
    };

    const result = ConsumptionAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe aceptar valores en cero', () => {
    const valid = {
      ingredient: 'tomato',
      currentStock: 0,
      averageConsumptionPerOrder: 0,
      standardDeviation: 0,
      totalConsumed: 0,
      totalOrders: 0,
      analysisWindowOrders: 0,
    };

    const result = ConsumptionAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar valores negativos en currentStock', () => {
    const valid = {
      ingredient: 'tomato',
      currentStock: -10,
      averageConsumptionPerOrder: 2.5,
      standardDeviation: 0.5,
      totalConsumed: 250,
      totalOrders: 100,
      analysisWindowOrders: 50,
    };

    const result = ConsumptionAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('Unit - RecommenderAI Types: PurchaseAnalysisSchema', () => {
  it('debe validar análisis de compras correcto', () => {
    const valid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 10,
      successfulPurchases: 8,
      failedPurchases: 2,
      successRate: 80,
      totalQuantityRequested: 100,
      totalQuantityReceived: 80,
      averageQuantityPerPurchase: 10,
      lastPurchaseAt: '2025-01-15T10:30:00.000Z',
    };

    const result = PurchaseAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar lastPurchaseAt null', () => {
    const valid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 0,
      successfulPurchases: 0,
      failedPurchases: 0,
      successRate: 0,
      totalQuantityRequested: 0,
      totalQuantityReceived: 0,
      averageQuantityPerPurchase: 0,
      lastPurchaseAt: null,
    };

    const result = PurchaseAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe rechazar successRate mayor a 100', () => {
    const invalid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 10,
      successfulPurchases: 8,
      failedPurchases: 2,
      successRate: 150,
      totalQuantityRequested: 100,
      totalQuantityReceived: 80,
      averageQuantityPerPurchase: 10,
      lastPurchaseAt: '2025-01-15T10:30:00.000Z',
    };

    const result = PurchaseAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar successRate menor a 0', () => {
    const invalid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 10,
      successfulPurchases: 8,
      failedPurchases: 2,
      successRate: -10,
      totalQuantityRequested: 100,
      totalQuantityReceived: 80,
      averageQuantityPerPurchase: 10,
      lastPurchaseAt: '2025-01-15T10:30:00.000Z',
    };

    const result = PurchaseAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe validar successRate exactamente 0', () => {
    const valid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 10,
      successfulPurchases: 0,
      failedPurchases: 10,
      successRate: 0,
      totalQuantityRequested: 100,
      totalQuantityReceived: 0,
      averageQuantityPerPurchase: 0,
      lastPurchaseAt: '2025-01-15T10:30:00.000Z',
    };

    const result = PurchaseAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe validar successRate exactamente 100', () => {
    const valid = {
      ingredient: 'chicken',
      totalPurchaseAttempts: 10,
      successfulPurchases: 10,
      failedPurchases: 0,
      successRate: 100,
      totalQuantityRequested: 100,
      totalQuantityReceived: 100,
      averageQuantityPerPurchase: 10,
      lastPurchaseAt: '2025-01-15T10:30:00.000Z',
    };

    const result = PurchaseAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('Unit - RecommenderAI Types: SmartAlertSchema', () => {
  it('debe validar alerta completa correcta', () => {
    const valid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: 85,
      ordersUsingThisIngredient: 45,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'High consumption detected',
      actionable: 'Consider increasing stock',
    };

    const result = SmartAlertSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar todos los tipos de alerta válidos', () => {
    const alertTypes = [
      'high_demand',
      'market_unreliable',
      'frequent_purchases',
      'potential_bottleneck',
      'ai_prediction',
    ];

    alertTypes.forEach((alertType) => {
      const valid = {
        ingredient: 'tomato',
        alertType,
        currentStock: 50,
        severity: 'medium',
        confidence: 85,
        ordersUsingThisIngredient: 45,
        purchaseFrequency: 5.2,
        marketSuccessRate: 90,
        recommendedMinStock: 100,
        reason: 'Test',
        actionable: 'Test action',
      };

      const result = SmartAlertSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  it('debe aceptar todos los niveles de severidad válidos', () => {
    const severities = ['low', 'medium', 'high', 'critical'];

    severities.forEach((severity) => {
      const valid = {
        ingredient: 'tomato',
        alertType: 'high_demand',
        currentStock: 50,
        severity,
        confidence: 85,
        ordersUsingThisIngredient: 45,
        purchaseFrequency: 5.2,
        marketSuccessRate: 90,
        recommendedMinStock: 100,
        reason: 'Test',
        actionable: 'Test action',
      };

      const result = SmartAlertSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  it('debe rechazar alertType inválido', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'invalid_type',
      currentStock: 50,
      severity: 'medium',
      confidence: 85,
      ordersUsingThisIngredient: 45,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar confidence mayor a 100', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: 150,
      ordersUsingThisIngredient: 45,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar confidence menor a 0', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: -10,
      ordersUsingThisIngredient: 45,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar ordersUsingThisIngredient mayor a 100', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: 85,
      ordersUsingThisIngredient: 150,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar ordersUsingThisIngredient menor a 0', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: 85,
      ordersUsingThisIngredient: -5,
      purchaseFrequency: 5.2,
      marketSuccessRate: 90,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar marketSuccessRate mayor a 100', () => {
    const invalid = {
      ingredient: 'tomato',
      alertType: 'high_demand',
      currentStock: 50,
      severity: 'medium',
      confidence: 85,
      ordersUsingThisIngredient: 45,
      purchaseFrequency: 5.2,
      marketSuccessRate: 150,
      recommendedMinStock: 100,
      reason: 'Test',
      actionable: 'Test action',
    };

    const result = SmartAlertSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('Unit - RecommenderAI Types: ConsumptionTrendSchema', () => {
  it('debe validar tendencia correcta', () => {
    const valid = {
      ingredient: 'rice',
      trend: 'increasing',
      trendStrength: 0.85,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar todos los tipos de tendencia válidos', () => {
    const trends = ['increasing', 'stable', 'decreasing'];

    trends.forEach((trend) => {
      const valid = {
        ingredient: 'rice',
        trend,
        trendStrength: 0.5,
        forecastNext10Orders: 25,
        forecastNext50Orders: 120,
        forecastNext100Orders: 240,
      };

      const result = ConsumptionTrendSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  it('debe rechazar trend inválido', () => {
    const invalid = {
      ingredient: 'rice',
      trend: 'invalid',
      trendStrength: 0.5,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar trendStrength mayor a 1', () => {
    const invalid = {
      ingredient: 'rice',
      trend: 'increasing',
      trendStrength: 1.5,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar trendStrength menor a 0', () => {
    const invalid = {
      ingredient: 'rice',
      trend: 'increasing',
      trendStrength: -0.1,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe aceptar trendStrength exactamente 0', () => {
    const valid = {
      ingredient: 'rice',
      trend: 'stable',
      trendStrength: 0,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar trendStrength exactamente 1', () => {
    const valid = {
      ingredient: 'rice',
      trend: 'increasing',
      trendStrength: 1,
      forecastNext10Orders: 25,
      forecastNext50Orders: 120,
      forecastNext100Orders: 240,
    };

    const result = ConsumptionTrendSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('Unit - RecommenderAI Types: PredictionResultSchema', () => {
  it('debe validar resultado de predicción completo', () => {
    const valid = {
      generatedAt: '2025-01-15T10:30:00.000Z',
      analysisWindowOrders: 100,
      totalOrdersAnalyzed: 500,
      alerts: [
        {
          ingredient: 'tomato',
          alertType: 'high_demand',
          currentStock: 50,
          severity: 'medium',
          confidence: 85,
          ordersUsingThisIngredient: 45,
          purchaseFrequency: 5.2,
          marketSuccessRate: 90,
          recommendedMinStock: 100,
          reason: 'High consumption',
          actionable: 'Increase stock',
        },
      ],
      consumptionAnalysis: [
        {
          ingredient: 'tomato',
          currentStock: 50,
          averageConsumptionPerOrder: 2.5,
          standardDeviation: 0.5,
          totalConsumed: 250,
          totalOrders: 100,
          analysisWindowOrders: 50,
        },
      ],
      purchaseAnalysis: [
        {
          ingredient: 'chicken',
          totalPurchaseAttempts: 10,
          successfulPurchases: 8,
          failedPurchases: 2,
          successRate: 80,
          totalQuantityRequested: 100,
          totalQuantityReceived: 80,
          averageQuantityPerPurchase: 10,
          lastPurchaseAt: '2025-01-15T10:30:00.000Z',
        },
      ],
      trends: [
        {
          ingredient: 'rice',
          trend: 'increasing',
          trendStrength: 0.85,
          forecastNext10Orders: 25,
          forecastNext50Orders: 120,
          forecastNext100Orders: 240,
        },
      ],
    };

    const result = PredictionResultSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe aceptar arrays vacíos', () => {
    const valid = {
      generatedAt: '2025-01-15T10:30:00.000Z',
      analysisWindowOrders: 0,
      totalOrdersAnalyzed: 0,
      alerts: [],
      consumptionAnalysis: [],
      purchaseAnalysis: [],
      trends: [],
    };

    const result = PredictionResultSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('debe rechazar sin campo requerido generatedAt', () => {
    const invalid = {
      analysisWindowOrders: 100,
      totalOrdersAnalyzed: 500,
      alerts: [],
      consumptionAnalysis: [],
      purchaseAnalysis: [],
      trends: [],
    };

    const result = PredictionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('debe rechazar con alert inválida', () => {
    const invalid = {
      generatedAt: '2025-01-15T10:30:00.000Z',
      analysisWindowOrders: 100,
      totalOrdersAnalyzed: 500,
      alerts: [
        {
          ingredient: 'tomato',
          alertType: 'invalid_type',
          currentStock: 50,
          severity: 'medium',
          confidence: 85,
          ordersUsingThisIngredient: 45,
          purchaseFrequency: 5.2,
          marketSuccessRate: 90,
          recommendedMinStock: 100,
          reason: 'Test',
          actionable: 'Test',
        },
      ],
      consumptionAnalysis: [],
      purchaseAnalysis: [],
      trends: [],
    };

    const result = PredictionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
