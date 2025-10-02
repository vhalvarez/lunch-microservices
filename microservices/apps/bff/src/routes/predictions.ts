import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type {
  PredictionAlert,
  PredictionSummary,
  ConsumptionAnalysisData,
  PurchaseAnalysisData,
} from '../interfaces/prediction.interface';
import type { RouteContext } from '../interfaces/routes.interface.js';

export function registerPredictionRoutes(router: FastifyInstance, ctx: RouteContext) {
  router.get('/predictions/latest', async (req, reply) => {
    try {
      const { rows: predRows } = await ctx.pool.query<{
        id: number;
        generated_at: string;
        analysis_window_orders: number;
        total_orders_analyzed: number;
        critical_alerts_count: number;
        high_alerts_count: number;
        medium_alerts_count: number;
        low_alerts_count: number;
      }>(
        `SELECT * FROM predictions 
           ORDER BY generated_at DESC 
           LIMIT 1`,
      );

      if (predRows.length === 0) {
        return reply.status(404).send({ error: 'No predictions available yet' });
      }

      const pred = predRows[0];

      const { rows: alertRows } = await ctx.pool.query<{
        ingredient: string;
        alert_type: string;
        current_stock: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        confidence: number;
        orders_using_ingredient: number;
        purchase_frequency: number;
        market_success_rate: number;
        recommended_reorder_qty: number;
        reason: string;
        actionable: string;
      }>(
        `SELECT * FROM prediction_alerts 
           WHERE prediction_id = $1
           ORDER BY 
             CASE severity 
               WHEN 'critical' THEN 1
               WHEN 'high' THEN 2
               WHEN 'medium' THEN 3
               WHEN 'low' THEN 4
             END,
             confidence DESC`,
        [pred.id],
      );

      const alerts: PredictionAlert[] = alertRows.map((row) => ({
        ingredient: row.ingredient,
        alertType: row.alert_type as any,
        currentStock: row.current_stock,
        severity: row.severity,
        confidence: row.confidence,
        ordersUsingThisIngredient: row.orders_using_ingredient,
        purchaseFrequency: row.purchase_frequency,
        marketSuccessRate: row.market_success_rate,
        recommendedMinStock: row.recommended_reorder_qty,
        reason: row.reason,
        actionable: row.actionable,
      }));

      const result: PredictionSummary = {
        generatedAt: pred.generated_at,
        analysisWindowOrders: pred.analysis_window_orders,
        totalOrdersAnalyzed: pred.total_orders_analyzed,
        totalAlerts: alerts.length,
        criticalAlerts: pred.critical_alerts_count,
        highAlerts: pred.high_alerts_count,
        mediumAlerts: pred.medium_alerts_count,
        lowAlerts: pred.low_alerts_count,
        alerts,
      };

      return result;
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get latest prediction');
      return reply.status(500).send({ error: 'Failed to retrieve prediction' });
    }
  });

  const AlertsQuerySchema = z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  });

  router.get('/predictions/alerts', async (req, reply) => {
    const parsed = AlertsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { severity } = parsed.data;

    try {
      let query = `
          SELECT pa.* 
            FROM prediction_alerts pa
           INNER JOIN predictions p ON pa.prediction_id = p.id
           WHERE p.id = (SELECT id FROM predictions ORDER BY generated_at DESC LIMIT 1)
        `;

      const params: any[] = [];

      if (severity) {
        query += ` AND pa.severity = $1`;
        params.push(severity);
      }

      query += ` ORDER BY 
          CASE pa.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          pa.confidence DESC`;

      const { rows } = await ctx.pool.query<{
        ingredient: string;
        alert_type: string;
        current_stock: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        confidence: number;
        orders_using_ingredient: number;
        purchase_frequency: number;
        market_success_rate: number;
        recommended_reorder_qty: number;
        reason: string;
        actionable: string;
      }>(query, params);

      const alerts: PredictionAlert[] = rows.map((row) => ({
        ingredient: row.ingredient,
        alertType: row.alert_type as any,
        currentStock: row.current_stock,
        severity: row.severity,
        confidence: row.confidence,
        ordersUsingThisIngredient: row.orders_using_ingredient,
        purchaseFrequency: row.purchase_frequency,
        marketSuccessRate: row.market_success_rate,
        recommendedMinStock: row.recommended_reorder_qty,
        reason: row.reason,
        actionable: row.actionable,
      }));

      return { alerts };
    } catch (error) {
      ctx.log.error({ error, severity }, 'Failed to get alerts');
      return reply.status(500).send({ error: 'Failed to retrieve alerts' });
    }
  });

  router.get('/predictions/consumption-analysis', async (req, reply) => {
    try {
      const { rows } = await ctx.pool.query<{
        ingredient: string;
        current_stock: number;
        average_consumption_per_order: number;
        standard_deviation: number;
        total_consumed: number;
        total_orders: number;
      }>(
        `SELECT pca.* 
           FROM prediction_consumption_analysis pca
           INNER JOIN predictions p ON pca.prediction_id = p.id
           WHERE p.id = (SELECT id FROM predictions ORDER BY generated_at DESC LIMIT 1)
           ORDER BY pca.ingredient`,
      );

      const analysis: ConsumptionAnalysisData[] = rows.map((row) => ({
        ingredient: row.ingredient,
        currentStock: row.current_stock,
        averageConsumptionPerOrder: row.average_consumption_per_order,
        standardDeviation: row.standard_deviation,
        totalConsumed: row.total_consumed,
        totalOrders: row.total_orders,
      }));

      return { analysis };
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get consumption analysis');
      return reply.status(500).send({ error: 'Failed to retrieve consumption analysis' });
    }
  });

  router.get('/predictions/purchase-analysis', async (req, reply) => {
    try {
      const { rows } = await ctx.pool.query<{
        ingredient: string;
        total_purchase_attempts: number;
        successful_purchases: number;
        failed_purchases: number;
        success_rate: number;
        total_quantity_requested: number;
        total_quantity_received: number;
        average_quantity_per_purchase: number;
        last_purchase_at: string | null;
      }>(
        `SELECT ppa.* 
           FROM prediction_purchase_analysis ppa
           INNER JOIN predictions p ON ppa.prediction_id = p.id
           WHERE p.id = (SELECT id FROM predictions ORDER BY generated_at DESC LIMIT 1)
           ORDER BY ppa.ingredient`,
      );

      const analysis: PurchaseAnalysisData[] = rows.map((row) => ({
        ingredient: row.ingredient,
        totalPurchaseAttempts: row.total_purchase_attempts,
        successfulPurchases: row.successful_purchases,
        failedPurchases: row.failed_purchases,
        successRate: row.success_rate,
        totalQuantityRequested: row.total_quantity_requested,
        totalQuantityReceived: row.total_quantity_received,
        averageQuantityPerPurchase: row.average_quantity_per_purchase,
        lastPurchaseAt: row.last_purchase_at,
      }));

      return { analysis };
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get purchase analysis');
      return reply.status(500).send({ error: 'Failed to retrieve purchase analysis' });
    }
  });

  router.get('/predictions/summary', async (req, reply) => {
    try {
      const { rows } = await ctx.pool.query<{
        generated_at: string;
        critical_alerts_count: number;
        high_alerts_count: number;
        medium_alerts_count: number;
        low_alerts_count: number;
      }>(
        `SELECT generated_at, critical_alerts_count, high_alerts_count, 
                medium_alerts_count, low_alerts_count
           FROM predictions 
           ORDER BY generated_at DESC 
           LIMIT 1`,
      );

      if (rows.length === 0) {
        return {
          available: false,
          message: 'No predictions available yet. Predictor service may still be initializing.',
        };
      }

      const pred = rows[0];

      return {
        available: true,
        generatedAt: pred.generated_at,
        totalAlerts:
          pred.critical_alerts_count +
          pred.high_alerts_count +
          pred.medium_alerts_count +
          pred.low_alerts_count,
        critical: pred.critical_alerts_count,
        high: pred.high_alerts_count,
        medium: pred.medium_alerts_count,
        low: pred.low_alerts_count,
      };
    } catch (error) {
      ctx.log.error({ error }, 'Failed to get predictions summary');
      return {
        available: false,
        message: 'Predictions not available',
      };
    }
  });
}
