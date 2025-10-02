import type { Pool } from 'pg';
import { createLogger } from '@lunch/logger';
import type { PredictionResult, SmartAlert, ConsumptionAnalysis, PurchaseAnalysis } from '@lunch/recommender-ai';

const log = createLogger('prediction-store');

interface PredictionRow {
  id: number;
  generated_at: string;
  analysis_window_orders: number;
  total_orders_analyzed: number;
}

interface AlertRow {
  ingredient: string;
  alert_type: string;
  current_stock: number;
  orders_using_ingredient: number;
  purchase_frequency: number;
  market_success_rate: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_reorder_qty: number;
  reason: string;
  actionable: string;
}

interface ConsumptionAnalysisRow {
  ingredient: string;
  current_stock: number;
  average_consumption_per_order: number;
  standard_deviation: number;
  total_consumed: number;
  total_orders: number;
}

interface PurchaseAnalysisRow {
  ingredient: string;
  total_purchase_attempts: number;
  successful_purchases: number;
  failed_purchases: number;
  success_rate: number;
  total_quantity_requested: number;
  total_quantity_received: number;
  average_quantity_per_purchase: number;
  last_purchase_at: string | null;
}

interface DeletedRow {
  id: number;
}

/**
 * Servicio para almacenar y recuperar predicciones
 */
export class PredictionStoreService {
  constructor(private pool: Pool) {}

  async checkTables(): Promise<void> {
    try {
      await this.pool.query(`SELECT 1 FROM predictions LIMIT 1`);
      log.info('Prediction tables verified');
    } catch (error) {
      log.error({ error }, 'Prediction tables not found. Run migrations first!');
      throw new Error('Prediction tables missing. Please run database migrations.');
    }
  }

  /**
   * Guarda una predicción completa en la base de datos
   */
  async savePrediction(prediction: PredictionResult): Promise<number> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Contar alertas por severidad
      const alertCounts = {
        critical: prediction.alerts.filter((a) => a.severity === 'critical').length,
        high: prediction.alerts.filter((a) => a.severity === 'high').length,
        medium: prediction.alerts.filter((a) => a.severity === 'medium').length,
        low: prediction.alerts.filter((a) => a.severity === 'low').length,
      };

      // Insertar registro principal de predicción
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO predictions (
          generated_at,
          analysis_window_orders,
          total_orders_analyzed,
          critical_alerts_count,
          high_alerts_count,
          medium_alerts_count,
          low_alerts_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          prediction.generatedAt,
          prediction.analysisWindowOrders,
          prediction.totalOrdersAnalyzed,
          alertCounts.critical,
          alertCounts.high,
          alertCounts.medium,
          alertCounts.low,
        ],
      );

      const predictionId = rows[0].id;

      for (const alert of prediction.alerts) {
        await client.query(
          `INSERT INTO prediction_alerts (
            prediction_id,
            ingredient,
            alert_type,
            current_stock,
            orders_using_ingredient,
            purchase_frequency,
            market_success_rate,
            confidence,
            severity,
            recommended_reorder_qty,
            reason,
            actionable
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            predictionId,
            alert.ingredient,
            alert.alertType,
            alert.currentStock,
            alert.ordersUsingThisIngredient,
            alert.purchaseFrequency,
            alert.marketSuccessRate,
            alert.confidence,
            alert.severity,
            alert.recommendedMinStock,
            alert.reason,
            alert.actionable,
          ],
        );
      }

      // Insertar análisis de consumo
      for (const analysis of prediction.consumptionAnalysis) {
        await client.query(
          `INSERT INTO prediction_consumption_analysis (
            prediction_id,
            ingredient,
            current_stock,
            average_consumption_per_order,
            standard_deviation,
            total_consumed,
            total_orders
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            predictionId,
            analysis.ingredient,
            analysis.currentStock,
            analysis.averageConsumptionPerOrder,
            analysis.standardDeviation,
            analysis.totalConsumed,
            analysis.totalOrders,
          ],
        );
      }

      // Insertar análisis de compras
      for (const purchase of prediction.purchaseAnalysis) {
        await client.query(
          `INSERT INTO prediction_purchase_analysis (
            prediction_id,
            ingredient,
            total_purchase_attempts,
            successful_purchases,
            failed_purchases,
            success_rate,
            total_quantity_requested,
            total_quantity_received,
            average_quantity_per_purchase,
            last_purchase_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            predictionId,
            purchase.ingredient,
            purchase.totalPurchaseAttempts,
            purchase.successfulPurchases,
            purchase.failedPurchases,
            purchase.successRate,
            purchase.totalQuantityRequested,
            purchase.totalQuantityReceived,
            purchase.averageQuantityPerPurchase,
            purchase.lastPurchaseAt,
          ],
        );
      }

      await client.query('COMMIT');

      log.info(
        {
          predictionId,
          alerts: prediction.alerts.length,
          critical: alertCounts.critical,
        },
        'Prediction saved successfully',
      );

      return predictionId;
    } catch (error) {
      await client.query('ROLLBACK');
      log.error({ error }, 'Failed to save prediction');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene la predicción más reciente
   */
  async getLatestPrediction(): Promise<PredictionResult | null> {
    try {
      const { rows: predRows } = await this.pool.query<PredictionRow>(
        `SELECT * FROM predictions 
         ORDER BY generated_at DESC 
         LIMIT 1`,
      );

      if (predRows.length === 0) {
        return null;
      }

      const pred = predRows[0];

      // Obtener alertas
      const { rows: alertRows } = await this.pool.query<AlertRow>(
        `SELECT * FROM prediction_alerts 
         WHERE prediction_id = $1
         ORDER BY severity, orders_using_ingredient DESC`,
        [pred.id],
      );

      // Obtener análisis de consumo
      const { rows: analysisRows } = await this.pool.query<ConsumptionAnalysisRow>(
        `SELECT * FROM prediction_consumption_analysis 
         WHERE prediction_id = $1
         ORDER BY ingredient`,
        [pred.id],
      );

      // Obtener análisis de compras
      const { rows: purchaseRows } = await this.pool.query<PurchaseAnalysisRow>(
        `SELECT * FROM prediction_purchase_analysis 
         WHERE prediction_id = $1
         ORDER BY ingredient`,
        [pred.id],
      );

      const alerts: SmartAlert[] = alertRows.map((row: AlertRow) => ({
        ingredient: row.ingredient as any,
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

      const consumptionAnalysis: ConsumptionAnalysis[] = analysisRows.map((row: ConsumptionAnalysisRow) => ({
        ingredient: row.ingredient as any,
        currentStock: row.current_stock,
        averageConsumptionPerOrder: row.average_consumption_per_order,
        standardDeviation: row.standard_deviation,
        totalConsumed: row.total_consumed,
        totalOrders: row.total_orders,
        analysisWindowOrders: pred.analysis_window_orders,
      }));

      const purchaseAnalysis: PurchaseAnalysis[] = purchaseRows.map((row: PurchaseAnalysisRow) => ({
        ingredient: row.ingredient as any,
        totalPurchaseAttempts: row.total_purchase_attempts,
        successfulPurchases: row.successful_purchases,
        failedPurchases: row.failed_purchases,
        successRate: row.success_rate,
        totalQuantityRequested: row.total_quantity_requested,
        totalQuantityReceived: row.total_quantity_received,
        averageQuantityPerPurchase: row.average_quantity_per_purchase,
        lastPurchaseAt: row.last_purchase_at ? new Date(row.last_purchase_at) : null,
      }));

      return {
        generatedAt: new Date(pred.generated_at),
        analysisWindowOrders: pred.analysis_window_orders,
        totalOrdersAnalyzed: pred.total_orders_analyzed,
        alerts,
        consumptionAnalysis,
        purchaseAnalysis,
        trends: [], // No se almacenan trends por ahora
      };
    } catch (error) {
      log.error({ error }, 'Failed to get latest prediction');
      throw error;
    }
  }

  /**
   * Limpia predicciones antiguas (mantiene solo las últimas N)
   */
  async cleanupOldPredictions(keepCount: number = 100): Promise<number> {
    try {
      const { rows } = await this.pool.query<DeletedRow>(
        `WITH old_predictions AS (
          SELECT id FROM predictions
          ORDER BY generated_at DESC
          OFFSET $1
        )
        DELETE FROM predictions
        WHERE id IN (SELECT id FROM old_predictions)
        RETURNING id`,
        [keepCount],
      );

      const deletedCount = rows.length;

      if (deletedCount > 0) {
        log.info({ deletedCount, keepCount }, 'Old predictions cleaned up');
      }

      return deletedCount;
    } catch (error) {
      log.error({ error, keepCount }, 'Failed to cleanup old predictions');
      throw error;
    }
  }
}
