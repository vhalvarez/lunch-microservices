import type { Pool } from 'pg';
import type { PredictionAlert, PredictionSummary, ConsumptionAnalysisData, PurchaseAnalysisData } from '../interfaces/prediction.interface.js';

export class PredictionsRepository {
    constructor(private pool: Pool) { }

    async getLatestPrediction() {
        return this.pool.query<{
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
    }

    async getPredictionAlerts(predictionId: number) {
        return this.pool.query<{
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
            [predictionId],
        );
    }

    async getLatestAlertsFiltered(severity?: string) {
        let query = `
        SELECT pa.* 
          FROM prediction_alerts pa
         INNER JOIN predictions p ON pa.prediction_id = p.id
         WHERE p.id = (SELECT id FROM predictions ORDER BY generated_at DESC LIMIT 1)
      `;

        const params: (string | number)[] = [];

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

        return this.pool.query<{
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
    }

    async getConsumptionAnalysis() {
        return this.pool.query<{
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
    }

    async getPurchaseAnalysis() {
        return this.pool.query<{
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
    }

    async getLatestPredictionSummary() {
        return this.pool.query<{
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
    }
}
