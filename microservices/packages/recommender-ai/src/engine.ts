import type { Ingredient } from '@lunch/shared-kernel';
import { createLogger } from '@lunch/logger';
import { env } from '@lunch/config';
import type {
  ConsumptionAnalysis,
  PurchaseAnalysis,
  SmartAlert,
  ConsumptionTrend,
  PredictionResult,
  HistoricalConsumption,
  MarketPurchase,
  PredictorConfig,
} from './types.js';
import { mean, standardDeviation, detectTrend } from './stats.js';
import { GroqClient, type PredictionAnalysisInput } from './groq-client.js';

const log = createLogger('predictor-engine');

export class PredictionEngine {
  private config: PredictorConfig;
  private aiClient: GroqClient | null = null;

  constructor(config?: Partial<PredictorConfig>) {
    this.config = {
      analysisWindowOrders: config?.analysisWindowOrders ?? 100,
      minDataPoints: config?.minDataPoints ?? 10,
      highDemandThreshold: config?.highDemandThreshold ?? 50,
      frequentPurchaseThreshold: config?.frequentPurchaseThreshold ?? 5,
      lowMarketSuccessThreshold: config?.lowMarketSuccessThreshold ?? 70,
      confidenceThreshold: config?.confidenceThreshold ?? 40,
      safetyStockMultiplier: config?.safetyStockMultiplier ?? 2.0,
    };

    // Inicializar Groq
    const groqEnabled = env.GROQ_ENABLED;

    log.info({ groqEnabled }, 'Checking Groq configuration');
    // Key log removed for security

    if (groqEnabled && env.GROQ_API_KEY) {
      try {
        this.aiClient = new GroqClient({
          apiKey: env.GROQ_API_KEY,
          model: env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
          temperature: 0.3,
          maxTokens: 400,
          enabled: true,
        });
        log.info('✅ Groq client initialized (llama-3.1-8b-instant - FREE TIER)');
      } catch (error) {
        log.error({ error }, 'Failed to initialize Groq client');
      }
    } else {
      log.warn('⚠️  Groq is disabled - using rule-based predictions only');
    }
  }

  /**
   * Análisis principal con IA integrada
   */
  public async predict(
    historicalConsumption: HistoricalConsumption[],
    marketPurchases: MarketPurchase[],
    currentStock: Record<Ingredient, number>,
  ): Promise<PredictionResult> {
    log.info(
      {
        consumptionDataPoints: historicalConsumption.length,
        purchaseDataPoints: marketPurchases.length,
        ingredients: Object.keys(currentStock).length,
        aiEnabled: !!this.aiClient?.isEnabled(),
      },
      '🚀 Starting prediction analysis with AI',
    );

    const consumptionByIngredient = this.groupByIngredient(historicalConsumption);
    const purchasesByIngredient = this.groupPurchasesByIngredient(marketPurchases);

    const consumptionAnalysis: ConsumptionAnalysis[] = [];
    const purchaseAnalysis: PurchaseAnalysis[] = [];
    const trends: ConsumptionTrend[] = [];
    const alerts: SmartAlert[] = [];

    // Preparar datos para análisis de IA
    const aiInputs: PredictionAnalysisInput[] = [];

    // Analizar cada ingrediente con reglas básicas
    for (const ingredient of Object.keys(currentStock) as Ingredient[]) {
      const stock = currentStock[ingredient] ?? 0;
      const consumption = consumptionByIngredient[ingredient] || [];
      const purchases = purchasesByIngredient[ingredient] || [];

      // Análisis estadístico básico
      const consAnalysis = this.analyzeConsumption(ingredient, consumption, stock);
      consumptionAnalysis.push(consAnalysis);

      const purchAnalysis = this.analyzePurchases(ingredient, purchases);
      purchaseAnalysis.push(purchAnalysis);

      const trend = this.analyzeTrend(ingredient, consumption);
      trends.push(trend);

      // Preparar datos para OpenAI solo si hay consumo significativo
      if (consumption.length >= this.config.minDataPoints) {
        const hoursUntilShortage = this.estimateHoursUntilShortage(consAnalysis, trend);

        aiInputs.push({
          ingredient,
          currentStock: stock,
          averageConsumptionRate: consAnalysis.averageConsumptionPerOrder,
          standardDeviation: consAnalysis.standardDeviation,
          totalOrders: consAnalysis.totalOrders,
          trend: trend.trend,
          trendStrength: trend.trendStrength,
          forecastNext24Hours: trend.forecastNext10Orders * 2.4, // estimado para 24h
          hoursUntilShortage,
        });
      }
    }

    // 🤖 Análisis con IA (Groq - GRATIS) si está disponible
    let aiAnalysis: Map<Ingredient, any> = new Map();
    if (this.aiClient?.isEnabled() && aiInputs.length > 0) {
      try {
        log.info({ ingredients: aiInputs.length }, '🤖 Requesting Groq AI analysis (FREE)...');

        // Analizar TODOS los ingredientes con datos suficientes
        for (const input of aiInputs) {
          try {
            const result = await this.aiClient.analyzePrediction(input);
            aiAnalysis.set(input.ingredient, result);

            // Delay entre requests para respetar rate limits de Groq
            await new Promise(resolve => setTimeout(resolve, 2100));
          } catch (error) {
            log.error({ error, ingredient: input.ingredient }, 'AI analysis failed for ingredient');
          }
        }

        log.info(
          {
            analyzed: aiAnalysis.size,
            total: aiInputs.length,
            stats: this.aiClient.getUsageStats()
          },
          '✅ AI analysis completed'
        );
      } catch (error) {
        log.error({ error }, '❌ AI analysis failed, falling back to rule-based');
      }
    }

    // Generar alertas combinando reglas + IA
    for (const ingredient of Object.keys(currentStock) as Ingredient[]) {
      const consAnalysis = consumptionAnalysis.find(c => c.ingredient === ingredient);
      const purchAnalysis = purchaseAnalysis.find(p => p.ingredient === ingredient);
      const trend = trends.find(t => t.ingredient === ingredient);

      if (!consAnalysis || !purchAnalysis || !trend) continue;

      const aiResult = aiAnalysis.get(ingredient);

      const alert = this.generateSmartAlert(
        ingredient,
        currentStock[ingredient] ?? 0,
        consAnalysis,
        purchAnalysis,
        trend,
        historicalConsumption.length,
        aiResult,
      );

      if (alert) alerts.push(alert);
    }

    // Ordenar alertas por severidad y confianza
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence; // Mayor confianza primero
    });

    const result: PredictionResult = {
      generatedAt: new Date(),
      analysisWindowOrders: Math.min(historicalConsumption.length, this.config.analysisWindowOrders),
      totalOrdersAnalyzed: historicalConsumption.length,
      alerts,
      consumptionAnalysis,
      purchaseAnalysis,
      trends,
    };

    log.info(
      {
        alerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        withAI: aiAnalysis.size,
        totalOrders: historicalConsumption.length,
      },
      '✅ Prediction completed successfully',
    );

    return result;
  }

  /**
   * Estima horas hasta shortage basado en consumo actual
   */
  private estimateHoursUntilShortage(
    consumption: ConsumptionAnalysis,
    trend: ConsumptionTrend,
  ): number | null {
    if (consumption.averageConsumptionPerOrder === 0) return null;

    // Ajustar por tendencia
    let adjustedRate = consumption.averageConsumptionPerOrder;
    if (trend.trend === 'increasing') {
      adjustedRate *= (1 + trend.trendStrength * 0.3);
    } else if (trend.trend === 'decreasing') {
      adjustedRate *= (1 - trend.trendStrength * 0.2);
    }

    // Estimación conservadora
    const hoursUntilEmpty = consumption.currentStock / Math.max(adjustedRate, 0.1);

    return hoursUntilEmpty > 0 ? hoursUntilEmpty : null;
  }

  /**
   * Analiza el consumo de un ingrediente
   */
  private analyzeConsumption(
    ingredient: Ingredient,
    data: HistoricalConsumption[],
    currentStock: number,
  ): ConsumptionAnalysis {
    if (data.length === 0) {
      return {
        ingredient,
        currentStock,
        averageConsumptionPerOrder: 0,
        standardDeviation: 0,
        totalConsumed: 0,
        totalOrders: 0,
        analysisWindowOrders: 0,
      };
    }

    const quantities = data.map((d) => d.quantityConsumed);
    const totalConsumed = quantities.reduce((sum, qty) => sum + qty, 0);
    const avgPerOrder = totalConsumed / data.length;
    const stdDev = standardDeviation(quantities);

    return {
      ingredient,
      currentStock,
      averageConsumptionPerOrder: avgPerOrder,
      standardDeviation: stdDev,
      totalConsumed,
      totalOrders: data.length,
      analysisWindowOrders: data.length,
    };
  }

  /**
   * Analiza las compras en el mercado
   */
  private analyzePurchases(ingredient: Ingredient, purchases: MarketPurchase[]): PurchaseAnalysis {
    if (purchases.length === 0) {
      return {
        ingredient,
        totalPurchaseAttempts: 0,
        successfulPurchases: 0,
        failedPurchases: 0,
        successRate: 0,
        totalQuantityRequested: 0,
        totalQuantityReceived: 0,
        averageQuantityPerPurchase: 0,
        lastPurchaseAt: null,
      };
    }

    const totalAttempts = purchases.length;
    const successful = purchases.filter((p) => p.quantitySold > 0).length;
    const failed = purchases.filter((p) => p.quantitySold === 0).length;
    const totalRequested = purchases.reduce((sum, p) => sum + p.quantityRequested, 0);
    const totalReceived = purchases.reduce((sum, p) => sum + p.quantitySold, 0);
    const successRate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0;
    const avgPerPurchase = successful > 0 ? totalReceived / successful : 0;
    const lastPurchase = purchases[purchases.length - 1]?.timestamp || null;

    return {
      ingredient,
      totalPurchaseAttempts: totalAttempts,
      successfulPurchases: successful,
      failedPurchases: failed,
      successRate,
      totalQuantityRequested: totalRequested,
      totalQuantityReceived: totalReceived,
      averageQuantityPerPurchase: avgPerPurchase,
      lastPurchaseAt: lastPurchase,
    };
  }

  /**
   * Analiza tendencias
   */
  private analyzeTrend(ingredient: Ingredient, data: HistoricalConsumption[]): ConsumptionTrend {
    if (data.length < 3) {
      return {
        ingredient,
        trend: 'stable',
        trendStrength: 0,
        forecastNext10Orders: 0,
        forecastNext50Orders: 0,
        forecastNext100Orders: 0,
      };
    }

    const quantities = data.map((d) => d.quantityConsumed);
    const { trend, strength } = detectTrend(quantities);
    const avgConsumption = mean(quantities);

    let multiplier = 1.0;
    if (trend === 'increasing') multiplier = 1.0 + strength * 0.2;
    else if (trend === 'decreasing') multiplier = 1.0 - strength * 0.2;

    return {
      ingredient,
      trend,
      trendStrength: strength,
      forecastNext10Orders: Math.max(0, avgConsumption * 10 * multiplier),
      forecastNext50Orders: Math.max(0, avgConsumption * 50 * multiplier),
      forecastNext100Orders: Math.max(0, avgConsumption * 100 * multiplier),
    };
  }

  /**
   * Genera alertas inteligentes combinando reglas + IA
   */
  private generateSmartAlert(
    ingredient: Ingredient,
    currentStock: number,
    consumption: ConsumptionAnalysis,
    purchases: PurchaseAnalysis,
    trend: ConsumptionTrend,
    totalOrders: number,
    aiResult?: any, // Resultado de OpenAI
  ): SmartAlert | null {
    // Necesitamos datos suficientes
    if (totalOrders < this.config.minDataPoints) {
      return null;
    }

    const alerts: Array<{
      type: string;
      severity: string;
      score: number;
      reason: string;
      actionable: string
    }> = [];

    // Si tenemos análisis de IA, usarlo como prioridad
    if (aiResult) {
      const aiSeverity = aiResult.riskLevel;
      const aiScore = aiResult.confidence;

      alerts.push({
        type: 'ai_prediction',
        severity: aiSeverity,
        score: aiScore,
        reason: aiResult.reasoning || aiResult.prediction,
        actionable: aiResult.recommendations?.join(' | ') || 'Revisar stock manualmente',
      });
    }

    // 1. Alta demanda - Ingrediente usado en muchos platos
    const usagePercentage = (consumption.totalOrders / totalOrders) * 100;
    if (usagePercentage > this.config.highDemandThreshold) {
      const severity = usagePercentage > 75 ? 'critical' : usagePercentage > 60 ? 'high' : 'medium';
      alerts.push({
        type: 'high_demand',
        severity,
        score: usagePercentage,
        reason: `Este ingrediente se usa en ${usagePercentage.toFixed(1)}% de los platos (${consumption.totalOrders} de ${totalOrders} órdenes)`,
        actionable: `Mantener stock mínimo de ${Math.ceil(consumption.averageConsumptionPerOrder * 20)} unidades`,
      });
    }

    // 2. Mercado no confiable
    if (purchases.totalPurchaseAttempts >= 3 && purchases.successRate < this.config.lowMarketSuccessThreshold) {
      const severity = purchases.successRate < 50 ? 'critical' : purchases.successRate < 60 ? 'high' : 'medium';
      alerts.push({
        type: 'market_unreliable',
        severity,
        score: 100 - purchases.successRate,
        reason: `El mercado tiene baja disponibilidad: ${purchases.successfulPurchases}/${purchases.totalPurchaseAttempts} compras exitosas (${purchases.successRate.toFixed(1)}%)`,
        actionable: `Aumentar stock de seguridad a ${Math.ceil(consumption.averageConsumptionPerOrder * this.config.safetyStockMultiplier * 15)} unidades`,
      });
    }

    // 3. Compras frecuentes
    const purchaseFrequency = totalOrders > 0 ? purchases.totalPurchaseAttempts / totalOrders : 0;
    if (purchaseFrequency > 1 / this.config.frequentPurchaseThreshold) {
      const severity = purchaseFrequency > 0.5 ? 'high' : purchaseFrequency > 0.3 ? 'medium' : 'low';
      alerts.push({
        type: 'frequent_purchases',
        severity,
        score: purchaseFrequency * 100,
        reason: `Compramos ${purchases.totalPurchaseAttempts} veces en ${totalOrders} órdenes (cada ${(totalOrders / purchases.totalPurchaseAttempts).toFixed(1)} platos)`,
        actionable: `Aumentar stock inicial en bodega a ${Math.ceil(consumption.averageConsumptionPerOrder * 30)} unidades`,
      });
    }

    // 4. Cuello de botella potencial
    if (
      currentStock < consumption.averageConsumptionPerOrder * 10 &&
      usagePercentage > 40 &&
      purchases.successRate < 80 &&
      purchases.totalPurchaseAttempts > 0
    ) {
      alerts.push({
        type: 'potential_bottleneck',
        severity: 'critical',
        score: 90,
        reason: `Combinación peligrosa: stock bajo (${currentStock}), alta demanda (${usagePercentage.toFixed(1)}%), mercado poco confiable (${purchases.successRate.toFixed(1)}%)`,
        actionable: `URGENTE: Aumentar stock a ${Math.ceil(consumption.averageConsumptionPerOrder * 50)} unidades inmediatamente`,
      });
    }

    // Si no hay alertas, retornar null
    if (alerts.length === 0) {
      return null;
    }

    // Priorizar alerta de IA si existe, sino tomar la más importante por score
    const mainAlert = aiResult && alerts[0].type === 'ai_prediction'
      ? alerts[0]
      : alerts.sort((a, b) => b.score - a.score)[0];

    // Calcular confianza (mayor si viene de IA)
    let confidence = aiResult ? aiResult.confidence : 50;
    if (!aiResult) {
      if (totalOrders >= this.config.minDataPoints * 2) confidence += 20;
      if (purchases.totalPurchaseAttempts >= 5) confidence += 15;
      if (trend.trendStrength > 0.6) confidence += 10;
      confidence = Math.min(100, confidence);
    }

    return {
      ingredient,
      alertType: mainAlert.type as any,
      currentStock,
      severity: mainAlert.severity as any,
      confidence,
      ordersUsingThisIngredient: usagePercentage,
      purchaseFrequency: purchaseFrequency * 100,
      marketSuccessRate: purchases.successRate,
      recommendedMinStock: Math.ceil(consumption.averageConsumptionPerOrder * this.config.safetyStockMultiplier * 20),
      reason: mainAlert.reason,
      actionable: mainAlert.actionable,
    };
  }

  private groupByIngredient(data: HistoricalConsumption[]): Record<Ingredient, HistoricalConsumption[]> {
    const grouped: Record<string, HistoricalConsumption[]> = {};
    for (const record of data) {
      if (!grouped[record.ingredient]) grouped[record.ingredient] = [];
      grouped[record.ingredient].push(record);
    }
    return grouped as Record<Ingredient, HistoricalConsumption[]>;
  }

  private groupPurchasesByIngredient(data: MarketPurchase[]): Record<Ingredient, MarketPurchase[]> {
    const grouped: Record<string, MarketPurchase[]> = {};
    for (const record of data) {
      if (!grouped[record.ingredient]) grouped[record.ingredient] = [];
      grouped[record.ingredient].push(record);
    }
    return grouped as Record<Ingredient, MarketPurchase[]>;
  }
}
