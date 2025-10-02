import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('migration-002');

/**
 * Migración 002: Tablas de predicciones (versión inicial - legacy)
 * Estas son las tablas viejas que luego se migrarán en 003
 */
export async function up() {
  const pool = getDbPool('migration-002');

  try {
    log.info('Running migration 002: Predictions tables (legacy)');

    await pool.query('BEGIN');

    // 1. Tabla principal de predicciones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        generated_at TIMESTAMPTZ NOT NULL,
        analysis_window_hours INTEGER NOT NULL,
        total_orders_analyzed INTEGER NOT NULL,
        critical_alerts_count INTEGER NOT NULL DEFAULT 0,
        high_alerts_count INTEGER NOT NULL DEFAULT 0,
        medium_alerts_count INTEGER NOT NULL DEFAULT 0,
        low_alerts_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Tabla de alertas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_alerts (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        current_stock INTEGER NOT NULL,
        predicted_shortage_at TIMESTAMPTZ,
        hours_until_shortage NUMERIC(10,2),
        confidence INTEGER NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        recommended_reorder_qty INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Tabla de análisis de consumo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_consumption_analysis (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        current_stock INTEGER NOT NULL,
        average_consumption_rate NUMERIC(10,4) NOT NULL,
        standard_deviation NUMERIC(10,4) NOT NULL,
        total_consumed INTEGER NOT NULL,
        total_orders INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_generated_at 
        ON predictions(generated_at DESC);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_prediction_id 
        ON prediction_alerts(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_ingredient 
        ON prediction_alerts(ingredient);
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_severity 
        ON prediction_alerts(severity);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_consumption_prediction_id 
        ON prediction_consumption_analysis(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_consumption_ingredient 
        ON prediction_consumption_analysis(ingredient);
    `);

    await pool.query('COMMIT');
    log.info('✅ Migration 002 completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Migration 002 failed');
    throw error;
  } finally {
    await closeDatabase('migration-002');
  }
}

export async function down() {
  const pool = getDbPool('migration-002-down');

  try {
    log.info('Rolling back migration 002');

    await pool.query('BEGIN');

    await pool.query('DROP TABLE IF EXISTS prediction_consumption_analysis CASCADE');
    await pool.query('DROP TABLE IF EXISTS prediction_alerts CASCADE');
    await pool.query('DROP TABLE IF EXISTS predictions CASCADE');

    await pool.query('COMMIT');
    log.info('✅ Migration 002 rolled back successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Rollback 002 failed');
    throw error;
  } finally {
    await closeDatabase('migration-002-down');
  }
}
