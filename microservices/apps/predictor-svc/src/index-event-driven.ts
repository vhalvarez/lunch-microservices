import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { Bus } from '@lunch/messaging';
import { Exchanges, RoutingKeys } from '@lunch/shared-kernel';
import { PredictionEngine } from '@lunch/recommender-ai';
import { getDbPool, closeDatabase } from '@lunch/db';
import { DataCollectorService } from './data-collector.js';
import { PredictionStoreService } from './prediction-store.js';

const log = createLogger('predictor-svc');

/**
 * Servicio principal de predicción con IA
 */
class PredictorService {
  private dataCollector: DataCollectorService;
  private predictionStore: PredictionStoreService;
  private predictionEngine: PredictionEngine;
  private bus: Bus;

  // Control de análisis
  private pendingAnalysis = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private ordersSinceLastAnalysis = 0;
  private lastAnalysisTime = Date.now();

  // Intervalos
  private forceAnalysisInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    const pool = getDbPool('predictor-svc');
    this.dataCollector = new DataCollectorService(pool);
    this.predictionStore = new PredictionStoreService(pool);

    this.bus = new Bus({ 
      url: env.AMQP_URL, 
      prefetch: env.RMQ_PREFETCH,
      appId: 'predictor-svc'
    });

    this.predictionEngine = new PredictionEngine({
      analysisWindowOrders: env.ANALYSIS_WINDOW_HOURS * 10,
      minDataPoints: 3,
      highDemandThreshold: 50,
      frequentPurchaseThreshold: 5,
      lowMarketSuccessThreshold: 70,
      confidenceThreshold: 30,
      safetyStockMultiplier: 1.5,
    });
  }

  async start(): Promise<void> {
    log.info(
      {
        analysisWindow: env.ANALYSIS_WINDOW_HOURS,
        minOrdersBatch: env.MIN_ORDERS_BATCH,
        debounceMs: env.DEBOUNCE_MS,
        mode: 'event-driven (high-demand)',
      },
      'Starting predictor service',
    );

    // Verificar que las tablas existan
    await this.predictionStore.checkTables();

    await this.bus.connect();

    // Configurar suscripciones
    await this.setupSubscriptions();

    await this.runPredictionAnalysis('initial');

    // Programar análisis periódico como fallback
    this.forceAnalysisInterval = setInterval(() => {
      this.forcePeriodicAnalysis();
    }, env.FORCE_ANALYSIS_INTERVAL_MS);

    // Programar limpieza periódica
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldPredictions().catch((err) => {
        log.error({ error: err }, 'Scheduled cleanup failed');
      });
    }, env.CLEANUP_INTERVAL_MS);

    log.info('Predictor service is running (event-driven mode)');
  }

  /**
   * Configura las suscripciones a eventos
   */
  private async setupSubscriptions(): Promise<void> {
    await this.bus.subscribe(
      'predictor.order.completed.q',
      [{ exchange: Exchanges.order, rk: RoutingKeys.orderCompleted }],
      async (msg: any) => {
        try {
          this.ordersSinceLastAnalysis++;
          log.debug(
            { ordersCount: this.ordersSinceLastAnalysis },
            'Order completed event received',
          );

          // Trigger análisis si alcanzamos el batch mínimo
          if (this.ordersSinceLastAnalysis >= env.MIN_ORDERS_BATCH) {
            log.info(
              { ordersCount: this.ordersSinceLastAnalysis },
              'Batch threshold reached, triggering analysis',
            );
            this.triggerAnalysis('batch-threshold');
          }
        } catch (error) {
          log.error({ error }, 'Error processing order completed event');
        }
      },
    );

    // Suscribirse a eventos de stock bajo
    await this.bus.subscribe(
      'predictor.stock.low.q',
      [{ exchange: Exchanges.inventory, rk: RoutingKeys.stockLow }],
      async (msg: any) => {
        try {
          log.warn({ ingredient: msg?.ingredient, qty: msg?.qty }, 'Low stock alert received');
          // Trigger análisis inmediato en caso de stock bajo
          this.triggerAnalysis('low-stock-alert');
        } catch (error) {
          log.error({ error }, 'Error processing low stock event');
        }
      },
    );

    log.info('Event subscriptions configured');
  }

  /**
   * Ejecuta el análisis predictivo
   */
  private async runPredictionAnalysis(reason: string = 'scheduled'): Promise<void> {
    if (this.pendingAnalysis) {
      log.debug('Analysis already in progress, skipping');
      return;
    }

    try {
      this.pendingAnalysis = true;
      log.info({ reason }, 'Starting prediction analysis');

      // Recolectar datos históricos
      const historicalData = await this.dataCollector.getHistoricalConsumption(
        env.ANALYSIS_WINDOW_HOURS,
      );
      const marketPurchases = await this.dataCollector.getMarketPurchases(
        env.ANALYSIS_WINDOW_HOURS,
      );
      const currentStock = await this.dataCollector.getCurrentStock();

      if (historicalData.length === 0) {
        log.warn('No historical data available for analysis');
        return;
      }

      // Ejecutar predicción
      const prediction = await this.predictionEngine.predict(
        historicalData,
        marketPurchases,
        currentStock
      );

      // Guardar predicción
      const predictionId = await this.predictionStore.savePrediction(prediction);

      // Resetear contador
      this.ordersSinceLastAnalysis = 0;
      this.lastAnalysisTime = Date.now();

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
          reason,
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

  /**
   * Trigger de análisis con debounce
   */
  private triggerAnalysis(reason: string = 'event-triggered'): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.runPredictionAnalysis(reason).catch((err) => {
        log.error({ error: err }, 'Triggered analysis failed');
      });
    }, env.DEBOUNCE_MS);
  }

  /**
   * Fuerza análisis periódico como fallback
   */
  private forcePeriodicAnalysis(): void {
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;

    // Solo forzar si ha pasado suficiente tiempo y hay órdenes nuevas
    if (timeSinceLastAnalysis >= env.FORCE_ANALYSIS_INTERVAL_MS && this.ordersSinceLastAnalysis > 0) {
      log.info(
        {
          ordersSinceLastAnalysis: this.ordersSinceLastAnalysis,
          minutesSinceLastAnalysis: Math.floor(timeSinceLastAnalysis / 60000),
        },
        'Forcing periodic analysis',
      );
      this.runPredictionAnalysis('forced-periodic').catch((err) => {
        log.error({ error: err }, 'Forced analysis failed');
      });
    }
  }

  /**
   * Limpia predicciones antiguas
   */
  private async cleanupOldPredictions(): Promise<void> {
    try {
      const deleted = await this.predictionStore.cleanupOldPredictions(env.KEEP_PREDICTIONS_COUNT);
      if (deleted > 0) {
        log.info({ deleted }, 'Old predictions cleaned up');
      }
    } catch (error) {
      log.error({ error }, 'Cleanup failed');
    }
  }

  /**
   * Detiene el servicio limpiamente
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down predictor service...');

    // Limpiar intervalos
    if (this.forceAnalysisInterval) {
      clearInterval(this.forceAnalysisInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Cerrar conexiones
    try {
      await this.bus.close();
      log.info('Message bus closed');
    } catch (error) {
      log.error({ error }, 'Error closing message bus');
    }

    try {
      await closeDatabase('predictor-svc');
      log.info('Database connection closed');
    } catch (error) {
      log.error({ error }, 'Error closing database');
    }
  }
}

async function main() {
  const service = new PredictorService();
  
  const shutdown = async () => {
    await service.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await service.start();
}

main().catch((err) => {
  log.error({ error: err }, 'Fatal error');
  process.exit(1);
});
