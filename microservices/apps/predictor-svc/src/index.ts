import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { createBus } from '@lunch/bus';
import { getDbPool, closeDatabase } from '@lunch/db';
import { DataCollectorRepository } from './repositories/data-collector.repo.js';
import { PredictionStoreRepository } from './repositories/prediction-store.repo.js';
import { PredictorService } from './core/predictor.service.js';
import { registerPredictionHandler } from './handlers/prediction.handler.js';

const log = createLogger('predictor-svc');

async function main() {
  log.info(
    {
      analysisWindow: env.ANALYSIS_WINDOW_HOURS,
      mode: 'event-driven (clean-arch) ✅',
    },
    'Starting predictor service',
  );

  const pool = getDbPool('predictor-svc');
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);

  await bus.connect();

  const dataCollector = new DataCollectorRepository(pool);
  const predictionStore = new PredictionStoreRepository(pool);

  await predictionStore.checkTables();

  const service = new PredictorService(dataCollector, predictionStore);

  // Registrar handlers de eventos
  await registerPredictionHandler(bus, service);

  // Ejecutar análisis inicial (para no esperar al primer evento)
  await service.runPredictionAnalysis(Number(env.ANALYSIS_WINDOW_HOURS || 1), 'initial');

  // Programar fallback periódico
  const forceInterval = setInterval(() => {
    service.forcePeriodicAnalysis().catch(err => log.error({ error: err }, 'Force analysis failed'));
  }, Number(env.FORCE_ANALYSIS_INTERVAL_MS || 300000));

  // Programar limpieza
  const cleanupInterval = setInterval(() => {
    service.cleanupOldPredictions(Number(env.KEEP_PREDICTIONS_COUNT || 100)).catch(err => log.error({ error: err }, 'Cleanup failed'));
  }, Number(env.CLEANUP_INTERVAL_MS || 3600000));

  const shutdown = async () => {
    log.info('Shutting down predictor service...');

    clearInterval(forceInterval);
    clearInterval(cleanupInterval);

    try {
      await (bus as any).close?.();
      log.info('Bus closed');
    } catch { }

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
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
