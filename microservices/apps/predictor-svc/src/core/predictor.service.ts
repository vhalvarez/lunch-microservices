import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { PredictionEngine } from '@lunch/recommender-ai';
import type { DataCollectorRepository } from '../repositories/data-collector.repo.js';
import type { PredictionStoreRepository } from '../repositories/prediction-store.repo.js';

const log = createLogger('predictor-service');

export class PredictorService {
    private predictionEngine: PredictionEngine;

    // State for event-driven mode
    private pendingAnalysis = false;
    private debounceTimer: NodeJS.Timeout | null = null;
    private ordersSinceLastAnalysis = 0;
    private lastAnalysisTime = Date.now();

    constructor(
        private dataCollector: DataCollectorRepository,
        private predictionStore: PredictionStoreRepository
    ) {
        this.predictionEngine = new PredictionEngine({
            analysisWindowOrders: (env.ANALYSIS_WINDOW_HOURS || 1) * 10, // heuristic
            minDataPoints: 3,
            highDemandThreshold: 50,
            frequentPurchaseThreshold: 5,
            lowMarketSuccessThreshold: 70,
            confidenceThreshold: 30,
            safetyStockMultiplier: 1.5,
        });
    }

    async handleOrderCompleted() {
        this.ordersSinceLastAnalysis++;
        log.debug({ count: this.ordersSinceLastAnalysis }, 'Order completed recorded');

        if (this.ordersSinceLastAnalysis >= env.MIN_ORDERS_BATCH) {
            log.info('Batch threshold reached, triggering analysis');
            this.triggerAnalysis('batch-threshold');
        }
    }

    async handleLowStock(ingredient: string) {
        log.warn({ ingredient }, 'Low stock alert received, triggering analysis');
        this.triggerAnalysis('low-stock-alert');
    }

    private triggerAnalysis(reason: string) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.runPredictionAnalysis(env.ANALYSIS_WINDOW_HOURS, reason);
        }, env.DEBOUNCE_MS);
    }

    async runPredictionAnalysis(windowHours: number, reason = 'scheduled') {
        if (this.pendingAnalysis) {
            log.debug('Analysis in progress, skipping');
            return;
        }

        try {
            this.pendingAnalysis = true;
            log.info({ reason }, 'Starting prediction analysis cycle');

            const historicalData = await this.dataCollector.getHistoricalConsumption(windowHours);
            const marketPurchases = await this.dataCollector.getMarketPurchases(windowHours);
            const currentStock = await this.dataCollector.getCurrentStock();

            if (historicalData.length === 0) {
                log.warn('No historical data available for analysis');
                return;
            }

            const prediction = await this.predictionEngine.predict(
                historicalData,
                marketPurchases,
                currentStock
            );

            const predictionId = await this.predictionStore.savePrediction(prediction);

            // Reset counters
            this.ordersSinceLastAnalysis = 0;
            this.lastAnalysisTime = Date.now();

            const criticalAlerts = prediction.alerts.filter((a) => a.severity === 'critical');
            const highAlerts = prediction.alerts.filter((a) => a.severity === 'high');

            log.info(
                {
                    predictionId,
                    totalAlerts: prediction.alerts.length,
                    critical: criticalAlerts.length,
                    high: highAlerts.length,
                    ordersAnalyzed: prediction.totalOrdersAnalyzed,
                },
                'Prediction analysis completed',
            );

            if (criticalAlerts.length > 0) {
                for (const alert of criticalAlerts) {
                    log.warn(
                        {
                            ingredient: alert.ingredient,
                            alertType: alert.alertType,
                            currentStock: alert.currentStock,
                            severity: alert.severity,
                            actionable: alert.actionable,
                        },
                        'CRITICAL ALERT',
                    );
                }
            }
        } catch (error) {
            log.error({ error }, 'Prediction analysis failed');
        } finally {
            this.pendingAnalysis = false;
        }
    }

    async forcePeriodicAnalysis() {
        const timeSinceLast = Date.now() - this.lastAnalysisTime;
        if (timeSinceLast >= env.FORCE_ANALYSIS_INTERVAL_MS && this.ordersSinceLastAnalysis > 0) {
            log.info('Forcing periodic analysis');
            await this.runPredictionAnalysis(env.ANALYSIS_WINDOW_HOURS, 'forced-periodic');
        }
    }

    async cleanupOldPredictions(keepCount: number) {
        try {
            const deleted = await this.predictionStore.cleanupOldPredictions(keepCount);
            if (deleted > 0) {
                log.info({ deleted }, 'Old predictions cleaned up');
            }
        } catch (error) {
            log.error({ error }, 'Cleanup failed');
        }
    }
}
