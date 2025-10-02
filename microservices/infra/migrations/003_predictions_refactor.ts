import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('migration-003');

/**
 * Migración 003: Refactorización de predicciones a modelo basado en órdenes
 * - Cambia de "horas" a "órdenes"
 * - Agrega análisis de compras en mercado
 * - Actualiza estructura de alertas
 */
export async function up() {
  const pool = getDbPool('migration-003');

  try {
    log.info('Running migration 003: Predictions refactoring to order-based model');

    await pool.query('BEGIN');

    // 1. Actualizar tabla predictions
    log.info('Updating predictions table...');
    
    // Primero verificar si la columna existe
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'predictions' 
      AND column_name = 'analysis_window_hours'
    `);

    if (rows.length > 0) {
      await pool.query(`
        ALTER TABLE predictions 
          RENAME COLUMN analysis_window_hours TO analysis_window_orders;
      `);
    } else {
      // Si no existe, verificar si ya está migrado
      const { rows: ordersRows } = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'predictions' 
        AND column_name = 'analysis_window_orders'
      `);
      
      if (ordersRows.length === 0) {
        // No existe ninguna, crear la nueva
        await pool.query(`
          ALTER TABLE predictions 
            ADD COLUMN analysis_window_orders INTEGER NOT NULL DEFAULT 100;
        `);
      }
    }

    // 2. Actualizar tabla prediction_alerts
    log.info('Updating prediction_alerts table...');
    
    // Eliminar columnas legacy
    await pool.query(`
      ALTER TABLE prediction_alerts 
        DROP COLUMN IF EXISTS predicted_shortage_at,
        DROP COLUMN IF EXISTS hours_until_shortage;
    `);

    // Agregar nuevas columnas
    await pool.query(`
      ALTER TABLE prediction_alerts 
        ADD COLUMN IF NOT EXISTS alert_type VARCHAR(50) NOT NULL DEFAULT 'high_demand',
        ADD COLUMN IF NOT EXISTS orders_using_ingredient NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS purchase_frequency NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS market_success_rate NUMERIC(5,2) NOT NULL DEFAULT 100,
        ADD COLUMN IF NOT EXISTS actionable TEXT NOT NULL DEFAULT '';
    `);

    // Agregar constraint para alert_type
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE prediction_alerts 
          ADD CONSTRAINT prediction_alerts_alert_type_check 
          CHECK (alert_type IN ('high_demand', 'market_unreliable', 'frequent_purchases', 'potential_bottleneck', 'ai_prediction'));
      EXCEPTION 
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 3. Actualizar tabla prediction_consumption_analysis
    log.info('Updating prediction_consumption_analysis table...');
    
    await pool.query(`
      ALTER TABLE prediction_consumption_analysis 
        DROP COLUMN IF EXISTS average_consumption_rate;
    `);

    await pool.query(`
      ALTER TABLE prediction_consumption_analysis 
        ADD COLUMN IF NOT EXISTS average_consumption_per_order NUMERIC(10,4) NOT NULL DEFAULT 0;
    `);

    // 4. Crear tabla prediction_purchase_analysis
    log.info('Creating prediction_purchase_analysis table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_purchase_analysis (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        total_purchase_attempts INTEGER NOT NULL DEFAULT 0,
        successful_purchases INTEGER NOT NULL DEFAULT 0,
        failed_purchases INTEGER NOT NULL DEFAULT 0,
        success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
        total_quantity_requested INTEGER NOT NULL DEFAULT 0,
        total_quantity_received INTEGER NOT NULL DEFAULT 0,
        average_quantity_per_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,
        last_purchase_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Crear índices nuevos
    log.info('Creating new indexes...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prediction_purchase_analysis_prediction_id 
        ON prediction_purchase_analysis(prediction_id);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_purchase_analysis_ingredient 
        ON prediction_purchase_analysis(ingredient);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_alert_type 
        ON prediction_alerts(alert_type);
    `);

    await pool.query('COMMIT');
    log.info('✅ Migration 003 completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Migration 003 failed');
    throw error;
  } finally {
    await closeDatabase('migration-003');
  }
}

export async function down() {
  const pool = getDbPool('migration-003-down');

  try {
    log.info('Rolling back migration 003');

    await pool.query('BEGIN');

    // 1. Eliminar nueva tabla
    await pool.query('DROP TABLE IF EXISTS prediction_purchase_analysis CASCADE');

    // 2. Revertir cambios en prediction_alerts
    await pool.query(`
      ALTER TABLE prediction_alerts 
        DROP COLUMN IF EXISTS alert_type,
        DROP COLUMN IF EXISTS orders_using_ingredient,
        DROP COLUMN IF EXISTS purchase_frequency,
        DROP COLUMN IF EXISTS market_success_rate,
        DROP COLUMN IF EXISTS actionable;
    `);

    await pool.query(`
      ALTER TABLE prediction_alerts 
        ADD COLUMN IF NOT EXISTS predicted_shortage_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS hours_until_shortage NUMERIC(10,2);
    `);

    // 3. Revertir cambios en prediction_consumption_analysis
    await pool.query(`
      ALTER TABLE prediction_consumption_analysis 
        DROP COLUMN IF EXISTS average_consumption_per_order;
    `);

    await pool.query(`
      ALTER TABLE prediction_consumption_analysis 
        ADD COLUMN IF NOT EXISTS average_consumption_rate NUMERIC(10,4) NOT NULL DEFAULT 0;
    `);

    // 4. Revertir cambios en predictions
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'predictions' 
      AND column_name = 'analysis_window_orders'
    `);

    if (rows.length > 0) {
      await pool.query(`
        ALTER TABLE predictions 
          RENAME COLUMN analysis_window_orders TO analysis_window_hours;
      `);
    }

    await pool.query('COMMIT');
    log.info('✅ Migration 003 rolled back successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Rollback 003 failed');
    throw error;
  } finally {
    await closeDatabase('migration-003-down');
  }
}
