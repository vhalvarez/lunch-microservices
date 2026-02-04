import type { PredictionAlert, PredictionSummary, ConsumptionAnalysisData, PurchaseAnalysisData } from '../interfaces/prediction.interface.js';
import type { PredictionsRepository } from '../repositories/predictions.repo.js';

export class PredictionsService {
    constructor(private repo: PredictionsRepository) { }

    async getLatestPrediction(): Promise<PredictionSummary | null> {
        const { rows: predRows } = await this.repo.getLatestPrediction();

        if (predRows.length === 0) {
            return null;
        }

        const pred = predRows[0];
        const { rows: alertRows } = await this.repo.getPredictionAlerts(pred.id);

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

        return {
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
    }

    async getAlerts(severity?: string): Promise<PredictionAlert[]> {
        const { rows } = await this.repo.getLatestAlertsFiltered(severity);

        return rows.map((row) => ({
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
    }

    async getConsumptionAnalysis(): Promise<ConsumptionAnalysisData[]> {
        const { rows } = await this.repo.getConsumptionAnalysis();

        return rows.map((row) => ({
            ingredient: row.ingredient,
            currentStock: row.current_stock,
            averageConsumptionPerOrder: row.average_consumption_per_order,
            standardDeviation: row.standard_deviation,
            totalConsumed: row.total_consumed,
            totalOrders: row.total_orders,
        }));
    }

    async getPurchaseAnalysis(): Promise<PurchaseAnalysisData[]> {
        const { rows } = await this.repo.getPurchaseAnalysis();

        return rows.map((row) => ({
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
    }

    async getSummary() {
        const { rows } = await this.repo.getLatestPredictionSummary();

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
    }
}
