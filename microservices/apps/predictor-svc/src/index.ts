import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { getDbPool, closeDatabase } from '@lunch/db';
import { PredictionEngine } from '@lunch/recommender-ai';
import { DataCollectorService } from './data-collector.js';
import { PredictionStoreService } from './prediction-store.js';

const log = createLogger('predictor-svc');

const PREDICTION_INTERVAL_MS = Number(env.FORCE_ANALYSIS_INTERVAL_MS ?? 5 * 60 * 1000); 
const ANALYSIS_WINDOW_HOURS = Number(env.ANALYSIS_WINDOW_HOURS ?? 1);
const CLEANUP_INTERVAL_MS = Number(env.CLEANUP_INTERVAL_MS ?? 60 * 60 * 1000);
const KEEP_PREDICTIONS_COUNT = Number(env.KEEP_PREDICTIONS_COUNT ?? 100);

async function main() {
  log.info(
    {
      predictionInterval: PREDICTION_INTERVAL_MS,
      analysisWindow: ANALYSIS_WINDOW_HOURS,
      mode: 'periodic',
    },
    'Starting predictor service',
  );

  const pool = getDbPool('predictor-svc');

  const dataCollector = new DataCollectorService(pool);
  const predictionStore = new PredictionStoreService(pool);

  await predictionStore.checkTables();

  const predictionEngine = new PredictionEngine({
    analysisWindowOrders: 100,
    minDataPoints: 10,
    highDemandThreshold: 50,
    frequentPurchaseThreshold: 5,
    lowMarketSuccessThreshold: 70,
    confidenceThreshold: 40,
    safetyStockMultiplier: 2.0,
  });

  /**
   * Ejecuta el análisis predictivo
   */
  async function runPredictionAnalysis() {
    try {
      log.info('Starting prediction analysis cycle');

      // Recolectar datos históricos
      const historicalData = await dataCollector.getHistoricalConsumption(ANALYSIS_WINDOW_HOURS);
      const marketPurchases = await dataCollector.getMarketPurchases(ANALYSIS_WINDOW_HOURS);
      const currentStock = await dataCollector.getCurrentStock();

      if (historicalData.length === 0) {
        log.warn('No historical data available for analysis');
        return;
      }

      // Ejecutar predicción con los 3 parámetros requeridos
      const prediction = await predictionEngine.predict(
        historicalData,
        marketPurchases,
        currentStock
      );

      // Guardar predicción
      const predictionId = await predictionStore.savePrediction(prediction);

      // Log resumen
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

      // Log alertas críticas
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
    }
  }

  /**
   * Limpia predicciones antiguas
   */
  async function cleanupOldPredictions() {
    try {
      const deleted = await predictionStore.cleanupOldPredictions(KEEP_PREDICTIONS_COUNT);
      if (deleted > 0) {
        log.info({ deleted }, 'Old predictions cleaned up');
      }
    } catch (error) {
      log.error({ error }, 'Cleanup failed');
    }
  }

  // Ejecutar análisis inicial
  await runPredictionAnalysis();

  // Programar análisis periódicos
  const predictionInterval = setInterval(() => {
    runPredictionAnalysis().catch((err) => {
      log.error({ error: err }, 'Scheduled prediction analysis failed');
    });
  }, PREDICTION_INTERVAL_MS);

  const cleanupInterval = setInterval(() => {
    cleanupOldPredictions().catch((err) => {
      log.error({ error: err }, 'Scheduled cleanup failed');
    });
  }, CLEANUP_INTERVAL_MS);

  const shutdown = async () => {
    log.info('Shutting down predictor service...');

    clearInterval(predictionInterval);
    clearInterval(cleanupInterval);

    try {
      await closeDatabase('predictor-svc');
      log.info('Database pool closed');
    } catch (error) {
      log.error({ error }, 'Error closing database pool');
    }

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log.info('Predictor service is running');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
